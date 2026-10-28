"""Port Income (Entry/Unity) tests: partner onboarding (unity only), daily accrual, level income (8 levels, $100 gate),
rank rewards (M1), principal withdraw (entry anytime / unity locked), celebrations, income streams, admin rules + income report.
Seeds directly in Mongo (TEST data), restarts backend to trigger startup backfill, cleans up at end."""
import os
import secrets
import subprocess
import time
from datetime import datetime, timedelta, timezone

import pytest
import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"
ROOT = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"


def _env(key):
    for line in open('/app/backend/.env'):
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"')


db = MongoClient(_env("MONGO_URL"))[_env("DB_NAME")]
CRON_SECRET = _env("WEBHOOK_CRON_SECRET")


def iso(dt):
    return dt.isoformat()


def sign_in(ref=None):
    acct = Account.create()
    r = requests.post(f"{API}/auth/nonce", json={"address": acct.address}, timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    sig = Account.sign_message(encode_defunct(text=j["message"]), private_key=acct.key).signature.hex()
    sig = sig if sig.startswith("0x") else "0x" + sig
    body = {"address": acct.address, "nonce": j["nonce"], "signature": sig}
    if ref:
        body["ref"] = ref
    r2 = requests.post(f"{API}/auth/verify", json=body, timeout=20)
    assert r2.status_code == 200, r2.text
    return {"addr": acct.address.lower(), "token": r2.json()["access_token"]}


def H(t):
    return {"Authorization": f"Bearer {t}"}


def purchase(addr, port, usd, days_ago=0.0):
    now = datetime.now(timezone.utc) - timedelta(days=days_ago)
    pid = ("EP-T" if port == "entry" else "UP-T") + secrets.token_hex(4).upper()
    db.port_purchases.insert_one({"_id": pid, "port": port, "address": addr, "amount_usd": float(usd), "merq_amount": usd * 10,
                                  "merq_amount_wei": "0", "merq_price": 0.1, "price_source": "TEST", "token_address": "0xTEST",
                                  "receive_wallet": "0xTEST", "tx_hash": "0x" + secrets.token_hex(32), "status": "confirmed",
                                  "created_at": iso(now), "verified_at": iso(now), "test_seed": True})
    return pid


def wait_backend():
    for _ in range(60):
        try:
            if requests.get(f"{API}/", timeout=5).status_code < 500:
                return
        except Exception:
            pass
        time.sleep(2)


S = {}


@pytest.fixture(scope="session", autouse=True)
def seed():
    # chain: root -> A1 -> A2 ... -> A9 (buyer). A2..A8 own $100 entry (gate open), A1 has nothing (L8 skipped)
    chain = []
    ref = ROOT
    for _ in range(9):
        u = sign_in(ref)
        chain.append(u)
        ref = u["addr"]
    S["chain"] = chain
    for u in chain[1:8]:
        purchase(u["addr"], "entry", 100)
    buyer = chain[8]
    S["entry_pid"] = purchase(buyer["addr"], "entry", 1000, days_ago=3.1)
    S["unity_pid"] = purchase(buyer["addr"], "unity", 2000, days_ago=3.1)
    S["unity_small"] = purchase(buyer["addr"], "unity", 500, days_ago=0)
    # rank: R with two directs X, Y each $10000 -> M1 (1.5% x 10000 = $150)
    R = sign_in(ROOT)
    X = sign_in(R["addr"])
    Y = sign_in(R["addr"])
    S.update(R=R, X=X, Y=Y)
    purchase(X["addr"], "entry", 10000)
    purchase(Y["addr"], "entry", 10000)
    # admin
    adm = Account.create()
    a = adm.address.lower()
    db.admin_users.insert_one({"_id": a, "address": adm.address, "role": "SUPER_ADMIN", "status": "active", "email": None,
                               "name": "TEST_admin", "twofa_enabled": False, "created_at": iso(datetime.now(timezone.utc))})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    r = requests.post(f"{API}/auth/nonce", json={"address": adm.address}).json()
    sig = Account.sign_message(encode_defunct(text=r["message"]), private_key=adm.key).signature.hex()
    sig = sig if sig.startswith("0x") else "0x" + sig
    v = requests.post(f"{API}/auth/verify", json={"address": adm.address, "nonce": r["nonce"], "signature": sig, "ref": ROOT})
    S["admin"] = v.json()["access_token"]
    S["admin_addr"] = a
    S["orig_rules"] = (db.settings.find_one({"_id": "global"}) or {}).get("port_income_rules")
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=True)
    time.sleep(5)
    wait_backend()
    time.sleep(8)  # startup backfill + accrue
    import json
    json.dump({k: v for k, v in S.items() if k != "orig_rules"}, open("/tmp/port_seed.json", "w"))
    yield
    if os.environ.get("KEEP_SEED"):
        return
    # cleanup
    addrs = [u["addr"] for u in chain] + [R["addr"], X["addr"], Y["addr"], a]
    db.port_purchases.delete_many({"test_seed": True})
    db.transactions.delete_many({"address": {"$in": addrs}})
    db.celebrations.delete_many({"member": {"$in": addrs}})
    db.rank_awards.delete_many({"member": {"$in": addrs}})
    db.income_events.delete_many({"member": {"$in": addrs}})
    db.members.delete_many({"_id": {"$in": addrs}})
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    if S.get("orig_rules") is None:
        db.settings.update_one({"_id": "global"}, {"$unset": {"port_income_rules": ""}})


def member(addr):
    return db.members.find_one({"_id": addr})


# ---- purchase processing ----
class TestProcessing:
    def test_entry_fields(self):
        p = db.port_purchases.find_one({"_id": S["entry_pid"]})
        assert p["income_processed"] and p["principal_status"] == "active"
        assert p["daily_pct"] == 0.30 and not p.get("lock_until")

    def test_unity_tier_and_lock(self):
        p = db.port_purchases.find_one({"_id": S["unity_pid"]})
        assert p["daily_pct"] == 0.75
        start = datetime.fromisoformat(p["accrual_start"])
        assert abs((datetime.fromisoformat(p["lock_until"]) - start).days - 365) <= 0
        assert db.port_purchases.find_one({"_id": S["unity_small"]})["daily_pct"] == 0.50

    def test_partner_onboarding_unity_only(self):
        sp = S["chain"][7]["addr"]
        txs = list(db.transactions.find({"address": sp, "type": "port_partner_onboarding_rewards"}))
        usd = sorted(t["meta"]["usd"] for t in txs)
        assert usd == [25.0, 100.0], usd  # 5% of 500 and 2000, nothing for entry
        assert round(member(sp)["income_usd"]["port_partner_onboarding_rewards"], 2) == 125.0


# ---- daily accrual + level income ----
class TestAccrual:
    def test_daily_earnings_3_days(self):
        b = S["chain"][8]["addr"]
        e = db.port_purchases.find_one({"_id": S["entry_pid"]})
        u = db.port_purchases.find_one({"_id": S["unity_pid"]})
        assert e["accrued_days"] == 3 and abs(e["earned_usd"] - 9.0) < 1e-6  # 1000*0.3%*3
        assert u["accrued_days"] == 3 and abs(u["earned_usd"] - 45.0) < 1e-6  # 2000*0.75%*3
        assert abs(member(b)["income_usd"]["port_daily_earnings"] - 54.0) < 1e-4

    def test_level_income(self):
        pcts = [25, 15, 10, 5, 4, 3, 2]
        for lvl, pct in enumerate(pcts, start=1):
            up = S["chain"][8 - lvl]["addr"]
            got = member(up).get("income_usd", {}).get("port_level_income", 0)
            assert abs(got - 54.0 * pct / 100) < 1e-3, (lvl, got)

    def test_level_skipped_l8(self):
        a1 = S["chain"][0]["addr"]
        assert member(a1).get("income_usd", {}).get("port_level_income", 0) == 0
        assert db.income_events.count_documents({"member": a1, "kind": "level_skipped", "level": 8}) >= 1

    def test_admin_accrue_idempotent(self):
        b = S["chain"][8]["addr"]
        before = member(b)["income_usd"]["port_daily_earnings"]
        r = requests.post(f"{API}/admin/port-income/accrue", headers=H(S["admin"]))
        assert r.status_code == 200 and r.json()["ok"] is True
        assert member(b)["income_usd"]["port_daily_earnings"] == before

    def test_cron_auth(self):
        assert requests.post(f"{API}/cron/port-accrual").status_code == 401
        assert requests.post(f"{API}/cron/port-accrual", headers={"Authorization": "Bearer wrong"}).status_code == 401
        rid = "TEST_" + secrets.token_hex(4)
        r = requests.post(f"{API}/cron/port-accrual", headers={"Authorization": f"Bearer {CRON_SECRET}", "x-webhook-id": rid})
        assert r.status_code == 200 and r.json()["accepted"] == rid
        r2 = requests.post(f"{API}/cron/port-accrual", headers={"Authorization": f"Bearer {CRON_SECRET}", "x-webhook-id": rid})
        assert r2.json().get("duplicate") is True
        db.cron_runs.delete_one({"_id": rid})


# ---- rank rewards ----
class TestRank:
    def test_m1_awarded_once(self):
        R = S["R"]["addr"]
        m = member(R)
        assert m.get("port_rank") == 1
        assert abs(m["income_usd"]["port_rank_rewards"] - 150.0) < 1e-6
        assert db.rank_awards.count_documents({"member": R}) == 1
        assert db.celebrations.count_documents({"member": R, "kind": "rank", "title": "M1"}) == 1

    def test_rank_stream_port_info(self):
        r = requests.get(f"{API}/income/stream/port_rank_rewards", headers=H(S["R"]["token"]))
        assert r.status_code == 200
        pi = r.json()["port_info"]
        assert pi["rank"] == "M1" and len(pi["legs"]) == 2 and pi["legs"][0]["usd"] == 10000
        assert pi["next_rank"]["name"] == "M2"


# ---- celebrations ----
class TestCelebrations:
    def test_list_and_seen(self):
        t = H(S["R"]["token"])
        cs = requests.get(f"{API}/income/celebrations", headers=t).json()
        assert any(c["kind"] == "rank" and c["title"] == "M1" for c in cs)
        cid = cs[0]["id"]
        assert requests.post(f"{API}/income/celebrations/{cid}/seen", headers=t).json()["ok"]
        assert cid not in [c["id"] for c in requests.get(f"{API}/income/celebrations", headers=t).json()]


# ---- member endpoints ----
class TestMemberEndpoints:
    def test_streams_include_daily(self):
        r = requests.get(f"{API}/income/streams", headers=H(S["chain"][8]["token"]))
        assert r.status_code == 200 and r.json()["port_daily_earnings"] > 0

    def test_level_stream_port_info(self):
        r = requests.get(f"{API}/income/stream/port_level_income", headers=H(S["chain"][7]["token"]))
        j = r.json()
        assert r.status_code == 200 and j["port_info"]["levels_unlocked"] is True
        assert j["port_info"]["level_pcts"] == [25, 15, 10, 5, 4, 3, 2, 1]
        assert any(h["level"] == 1 for h in j["history"])

    def test_ports_status(self):
        r = requests.get(f"{API}/ports/status", headers=H(S["chain"][8]["token"]))
        assert r.status_code == 200
        j = r.json()
        assert j["rates"]["entry_daily_pct"] == 0.30 and j["rates"]["unity_lock_days"] == 365
        h = {x["id"]: x for x in j["history"]}
        assert h[S["entry_pid"]]["can_withdraw_principal"] is True
        assert h[S["unity_pid"]]["can_withdraw_principal"] is False and h[S["unity_pid"]]["lock_until"]
        assert h[S["unity_pid"]]["earned_usd"] == 45.0


# ---- principal withdraw ----
class TestPrincipal:
    def test_unity_locked(self):
        r = requests.post(f"{API}/ports/principal/{S['unity_pid']}/withdraw", headers=H(S["chain"][8]["token"]))
        assert r.status_code == 400 and "locked" in r.text

    def test_other_member_404(self):
        r = requests.post(f"{API}/ports/principal/{S['entry_pid']}/withdraw", headers=H(S["chain"][7]["token"]))
        assert r.status_code == 404

    def test_entry_withdraw(self):
        b = S["chain"][8]
        before = member(b["addr"])["available"]
        r = requests.post(f"{API}/ports/principal/{S['entry_pid']}/withdraw", headers=H(b["token"]))
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["usd"] == 1000
        assert abs(member(b["addr"])["available"] - before - j["merq"]) < 1e-4
        assert db.port_purchases.find_one({"_id": S["entry_pid"]})["principal_status"] == "withdrawn"
        r2 = requests.post(f"{API}/ports/principal/{S['entry_pid']}/withdraw", headers=H(b["token"]))
        assert r2.status_code in (404, 409)


# ---- admin ----
class TestAdmin:
    def test_rules_get(self):
        r = requests.get(f"{API}/admin/port-income-rules", headers=H(S["admin"]))
        assert r.status_code == 200
        j = r.json()
        assert len(j["rules"]["level_pcts"]) == 8 and len(j["rules"]["ranks"]) == 7
        assert "port_daily_earnings" in j["totals"]

    def test_rules_validation(self):
        a = H(S["admin"])
        assert requests.put(f"{API}/admin/port-income-rules", headers=a, json={"level_pcts": [1, 2, 3]}).status_code == 400
        assert requests.put(f"{API}/admin/port-income-rules", headers=a, json={"entry_daily_pct": 150}).status_code == 400
        assert requests.put(f"{API}/admin/port-income-rules", headers=a, json={"entry_daily_pct": "abc"}).status_code == 400

    def test_rules_update_persist(self):
        a = H(S["admin"])
        r = requests.put(f"{API}/admin/port-income-rules", headers=a, json={"entry_daily_pct": 0.35})
        assert r.status_code == 200
        assert requests.get(f"{API}/admin/port-income-rules", headers=a).json()["rules"]["entry_daily_pct"] == 0.35
        requests.put(f"{API}/admin/port-income-rules", headers=a, json={"entry_daily_pct": 0.30})

    def test_member_forbidden(self):
        assert requests.get(f"{API}/admin/port-income-rules", headers=H(S["R"]["token"])).status_code == 403

    def test_income_report(self):
        a = H(S["admin"])
        r = requests.get(f"{API}/admin/income-report", headers=a, params={"stream": "port_level_income", "q": S["chain"][7]["addr"]})
        assert r.status_code == 200
        j = r.json()
        assert j["total"] >= 1 and all(x["type"] == "port_level_income" for x in j["rows"])
        assert j["rows"][0]["detail"] == "Level 1"
        r = requests.get(f"{API}/admin/income-report", headers=a)
        assert set(r.json()["summary"]) >= {"port_daily_earnings", "port_rank_rewards", "tp_partner_onboarding"}
        today = datetime.now(timezone.utc).date().isoformat()
        r = requests.get(f"{API}/admin/income-report", headers=a, params={"start": today, "end": today, "q": S["R"]["addr"]})
        assert r.json()["total"] >= 1

    def test_income_export(self):
        r = requests.get(f"{API}/admin/income-report/export", headers=H(S["admin"]), params={"stream": "port_rank_rewards"})
        assert r.status_code == 200 and "text/csv" in r.headers["content-type"]
        assert r.text.splitlines()[0].startswith("id,wallet,income")
        assert S["R"]["addr"] in r.text
