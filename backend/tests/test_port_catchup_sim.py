# Local-DB sim: Unity Port catch-up accrual (maybe_accrue / accrue) at 1 AM IST, idempotency, missed days, next_payout
import asyncio, types, sys
from datetime import datetime, timezone, timedelta
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
sys.path.insert(0, "/app/backend")
import port_income
from port_income import build_port_income, payout_days, next_payout

IST = timezone(timedelta(hours=5, minutes=30))
DBN = "merqon_port_catchup_test"


def run(coro):
    return asyncio.get_event_loop().run_until_complete(coro) if False else asyncio.run(coro)


async def setup(now):
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    await db.client.drop_database(DBN)
    async def gs(): return (await db.settings.find_one({"_id": "global"})) or {}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp, current_member=lambda: None,
                              iso=lambda t: t.isoformat(), now_utc=lambda: now[0], parse_iso=datetime.fromisoformat)
    await db.settings.insert_one({"_id": "global"})
    build_port_income(d)
    # chain: root <- S (entry 100 self-invest) <- U (unity 200)
    await db.members.insert_many([{"_id": "root", "sponsor": None}, {"_id": "S", "sponsor": "root"}, {"_id": "U", "sponsor": "S"}])
    s_start = datetime(2026, 11, 1, 10, 0, tzinfo=timezone.utc)
    p0 = {"_id": "PS", "address": "S", "port": "entry", "amount_usd": 100.0, "status": "confirmed",
          "created_at": s_start.isoformat(), "verified_at": s_start.isoformat()}
    await db.port_purchases.insert_one(p0)
    await d.process_port_income(p0)
    t = datetime(2026, 11, 5, 22, 40, tzinfo=IST).astimezone(timezone.utc)
    p = {"_id": "PU", "address": "U", "port": "unity", "amount_usd": 200.0, "status": "confirmed",
         "created_at": t.isoformat(), "verified_at": t.isoformat()}
    await db.port_purchases.insert_one(p)
    await d.process_port_income(p)
    return db, d


async def u_daily(db, pid="PU"):
    return [x async for x in db.transactions.find({"type": "port_daily_earnings", "meta.purchase": pid})]


async def scenario():
    now = [datetime(2026, 11, 5, 22, 45, tzinfo=IST).astimezone(timezone.utc)]
    db, d = await setup(now)
    out = {}
    pu = await db.port_purchases.find_one({"_id": "PU"})
    out["pct"] = pu["daily_pct"]
    out["next"] = next_payout(datetime.fromisoformat(pu["accrual_start"]), 0).isoformat()
    # before 1 AM IST
    now[0] = datetime(2026, 11, 6, 0, 59, tzinfo=IST).astimezone(timezone.utc)
    await d.port_accrue()
    out["before"] = len(await u_daily(db))
    # after 1 AM IST, via maybe_accrue (background)
    now[0] = datetime(2026, 11, 6, 1, 0, 5, tzinfo=IST).astimezone(timezone.utc)
    d.port_maybe_accrue()
    await asyncio.sleep(1.0)
    tx = await u_daily(db)
    out["after_n"] = len(tx); out["after_amt"] = tx[0]["amount"] if tx else None
    out["level_S"] = [x["amount"] async for x in db.transactions.find({"type": "port_level_income", "address": "S", "meta.purchase": "PU"})]
    out["skipped_root"] = await db.income_events.count_documents({"kind": "level_skipped", "member": "root"})
    # throttle: maybe_accrue within 15 min should not schedule
    n_tasks_before = len(port_income._tasks)
    d.port_maybe_accrue()
    out["throttled"] = len(port_income._tasks) == n_tasks_before
    # repeat accrue -> no double pay
    await asyncio.gather(d.port_accrue(), d.port_accrue(), d.port_accrue())
    out["repeat_n"] = len(await u_daily(db))
    pu = await db.port_purchases.find_one({"_id": "PU"})
    out["accrued_days"] = pu["accrued_days"]; out["earned"] = pu["earned_usd"]
    out["next2"] = next_payout(datetime.fromisoformat(pu["accrual_start"]), pu["accrued_days"]).isoformat()
    # 3 missed days -> single run pays 3 days
    now[0] = datetime(2026, 11, 9, 1, 30, tzinfo=IST).astimezone(timezone.utc)
    await d.port_accrue(); await d.port_accrue()
    tx = await u_daily(db)
    out["missed_n"] = len(tx); out["missed_last"] = (tx[-1]["amount"], tx[-1]["meta"]["days"])
    pu = await db.port_purchases.find_one({"_id": "PU"})
    out["accrued_days2"] = pu["accrued_days"]; out["earned2"] = pu["earned_usd"]
    U = await db.members.find_one({"_id": "U"})
    out["U_avail"] = U["available"]
    await db.client.drop_database(DBN)
    return out


@pytest.fixture(scope="module")
def res():
    return asyncio.run(scenario())


def test_unity_rate_200(res): assert res["pct"] == 0.5
def test_first_due(res): assert res["next"] == "2026-11-05T19:30:00+00:00"
def test_nothing_before_1am(res): assert res["before"] == 0
def test_one_day_after_1am_via_maybe_accrue(res):
    assert res["after_n"] == 1 and abs(res["after_amt"] - 1.0) < 1e-9
def test_level_income_to_upline(res): assert len(res["level_S"]) == 1 and abs(res["level_S"][0] - 0.25) < 1e-9
def test_root_skipped_no_self_invest(res): assert res["skipped_root"] >= 1
def test_throttle(res): assert res["throttled"]
def test_no_double_pay(res): assert res["repeat_n"] == 1 and res["accrued_days"] == 1 and abs(res["earned"] - 1.0) < 1e-9
def test_next_after_one(res): assert res["next2"] == "2026-11-06T19:30:00+00:00"
def test_missed_3_days_single_run(res):
    assert res["missed_n"] == 2 and res["missed_last"] == (3.0, 3) and res["accrued_days2"] == 4 and abs(res["earned2"] - 4.0) < 1e-9
def test_member_available(res): assert abs(res["U_avail"] - 4.0) < 1e-9


def test_payout_days_edges():
    s = datetime(2026, 11, 5, 17, 10, tzinfo=timezone.utc)  # 22:40 IST
    assert payout_days(s, datetime(2026, 11, 5, 19, 29, 59, tzinfo=timezone.utc)) == 0
    assert payout_days(s, datetime(2026, 11, 5, 19, 30, tzinfo=timezone.utc)) == 1
    assert payout_days(s, datetime(2026, 11, 8, 19, 30, tzinfo=timezone.utc)) == 4
