# Iteration 12: payout_days 1AM IST unit tests, local accrual sim crossing 1AM IST, GM entry celebration, cron endpoint auth/dup
import asyncio, os, sys, types
from datetime import datetime, timezone, timedelta
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, "/app/backend")
from port_income import payout_days, build_port_income  # noqa
from income_engine import build_income_engine  # noqa

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    for line in open("/app/frontend/.env"):
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
SECRET = None
for line in open("/app/backend/.env"):
    if line.startswith("WEBHOOK_CRON_SECRET="):
        SECRET = line.split("=", 1)[1].strip().strip('"')
U = lambda s: datetime.fromisoformat(s.replace("Z", "+00:00"))


# ---- payout_days unit tests
class TestPayoutDays:
    def test_spec_cases(self):
        s = U("2026-11-05T17:10:00Z")
        assert payout_days(s, U("2026-11-05T19:29:00Z")) == 0
        assert payout_days(s, U("2026-11-05T19:29:59Z")) == 0
        assert payout_days(s, U("2026-11-05T19:30:00Z")) == 1
        assert payout_days(s, U("2026-11-06T19:29:59Z")) == 1
        assert payout_days(s, U("2026-11-06T19:30:00Z")) == 2
        assert payout_days(s, U("2026-11-15T19:30:00Z")) == 11

    def test_start_exactly_at_boundary_and_before(self):
        b = U("2026-11-05T19:30:00Z")  # exactly 1AM IST
        assert payout_days(b, b) == 0
        assert payout_days(b, b + timedelta(hours=23, minutes=59)) == 0
        assert payout_days(b, b + timedelta(days=1)) == 1
        early = U("2026-11-05T19:20:00Z")  # 00:50 IST -> 10 minutes to first payout
        assert payout_days(early, U("2026-11-05T19:30:00Z")) == 1

    def test_now_before_start(self):
        s = U("2026-11-05T17:10:00Z")
        assert payout_days(s, s - timedelta(days=3)) == 0

    def test_naive_offset_strings(self):
        s = datetime.fromisoformat("2026-11-05T22:40:00+05:30")
        assert payout_days(s, U("2026-11-05T19:30:00Z")) == 1


# ---- local DB simulation (never Atlas)
DBN = "merqon_port_ist_test"
NOW = [U("2026-11-05T17:10:00Z")]


def _env():
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]

    async def gs(): return (await db.settings.find_one({"_id": "global"})) or {}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp, current_member=lambda: None,
                              iso=lambda t: t.isoformat(), now_utc=lambda: NOW[0], parse_iso=datetime.fromisoformat)
    return db, d


def test_local_accrual_crossing_1am_ist():
    async def run():
        db, d = _env()
        await db.client.drop_database(DBN)
        await db.settings.insert_one({"_id": "global"})
        build_port_income(d)
        NOW[0] = U("2026-11-05T17:10:00Z")
        await db.members.insert_many([{"_id": "S", "sponsor": None}, {"_id": "B", "sponsor": "S"}])
        for pid, addr, usd in [("PS", "S", 100.0), ("PB", "B", 1000.0)]:
            p = {"_id": pid, "address": addr, "port": "entry", "amount_usd": usd, "status": "confirmed",
                 "created_at": NOW[0].isoformat(), "verified_at": NOW[0].isoformat()}
            await db.port_purchases.insert_one(p)
            await d.process_port_income(p)
        cnt = lambda: db.transactions.count_documents({"type": "port_daily_earnings", "meta.purchase": "PB"})
        lvl = lambda: db.transactions.count_documents({"type": "port_level_income", "meta.purchase": "PB"})
        NOW[0] = U("2026-11-05T19:29:00Z"); await d.port_accrue()
        r0 = (await cnt(), await lvl())
        NOW[0] = U("2026-11-05T19:30:00Z"); await d.port_accrue(); await d.port_accrue()
        r1 = (await cnt(), await lvl())
        NOW[0] = U("2026-11-06T10:00:00Z"); await d.port_accrue()
        r1b = (await cnt(), await lvl())
        NOW[0] = U("2026-11-06T19:30:00Z"); await d.port_accrue(); await d.port_accrue()
        r2 = (await cnt(), await lvl())
        B = await db.members.find_one({"_id": "B"}); S = await db.members.find_one({"_id": "S"})
        pb = await db.port_purchases.find_one({"_id": "PB"})
        st = await db.settings.find_one({"_id": "global"})
        await db.client.drop_database(DBN)
        return r0, r1, r1b, r2, B, S, pb, st
    r0, r1, r1b, r2, B, S, pb, st = asyncio.run(run())
    assert r0 == (0, 0)
    assert r1 == (1, 1), r1
    assert r1b == (1, 1), r1b
    assert r2 == (2, 2), r2
    assert pb["accrued_days"] == 2
    assert abs(B["income_usd"]["port_daily_earnings"] - 6.0) < 1e-6  # 1000*0.3%*2
    assert abs(S["income_usd"]["port_level_income"] - 1.5) < 1e-6    # 25% of 6
    assert st["port_last_accrual"].startswith("2026-11-06T19:30")


def test_local_gm_entry_celebration():
    async def run():
        db = AsyncIOMotorClient("mongodb://localhost:27017")["merqon_gm_celeb_test"]
        await db.client.drop_database("merqon_gm_celeb_test")
        os.environ.setdefault("OWNER_ADMIN_WALLETS", "0xroot")
        async def gs(): return {"admin_addresses": ["0xroot"]}
        async def sw(): return {}
        async def lp(a, b): return (0.1, "admin_price", 18)
        d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                                  iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
        build_income_engine(d)
        n = [0]
        async def buy(addr):
            n[0] += 1
            tp = {"_id": f"TP{n[0]}", "address": addr, "price_usd": 120.0, "status": "confirmed", "created_at": f"{n[0]:04d}"}
            await db.techpass.insert_one(tp)
            await d.process_techpass_income(tp)
        await db.members.insert_many([{"_id": "0xroot", "sponsor": None}, {"_id": "A", "sponsor": "0xroot"},
                                      {"_id": "A1", "sponsor": "A"}, {"_id": "A2", "sponsor": "A"}, {"_id": "A3", "sponsor": "A"}])
        await buy("A"); c0 = await db.celebrations.count_documents({"member": "A"})
        await buy("A1"); c1 = await db.celebrations.count_documents({"member": "A"})
        await buy("A2"); c2 = list(await db.celebrations.find({"member": "A"}).to_list(10))
        await buy("A3"); c3 = await db.celebrations.count_documents({"member": "A"})
        await db.client.drop_database("merqon_gm_celeb_test")
        return c0, c1, c2, c3
    c0, c1, c2, c3 = asyncio.run(run())
    assert c0 == 0 and c1 == 0
    assert len(c2) == 1 and c2[0]["kind"] == "gm_entry" and c2[0]["title"] == "Global Momentum" and c2[0]["seen"] is False
    assert c3 == 1  # no duplicate on later directs


# ---- cron endpoint (public URL; triggers the real daily accrual which is idempotent)
class TestCronEndpoint:
    def test_no_auth_401(self):
        r = requests.post(f"{BASE_URL}/api/cron/port-accrual", timeout=30)
        assert r.status_code == 401

    def test_wrong_secret_401(self):
        r = requests.post(f"{BASE_URL}/api/cron/port-accrual", headers={"Authorization": "Bearer nope"}, timeout=30)
        assert r.status_code == 401

    def test_valid_and_duplicate(self):
        assert SECRET
        wid = "TEST_" + os.urandom(6).hex()
        h = {"Authorization": f"Bearer {SECRET}", "X-Webhook-Id": wid}
        r = requests.post(f"{BASE_URL}/api/cron/port-accrual", headers=h, timeout=30)
        assert r.status_code == 200 and r.json().get("accepted") == wid, r.text
        r2 = requests.post(f"{BASE_URL}/api/cron/port-accrual", headers=h, timeout=30)
        assert r2.status_code == 200 and r2.json().get("duplicate") is True, r2.text
