"""Withdraw in USDT -> MERQ payout (quote, request, auto-process, no cooldown). Requires tests/atlas_withdraw_env.py setup."""
import json, os
import pytest, requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/")
API = BASE_URL + "/api"
ENV = json.load(open("/tmp/wd_env.json"))
H = {"Authorization": f"Bearer {ENV['member_jwt']}"}
HA = {"Authorization": f"Bearer {ENV['admin_jwt']}"}


def _db():
    from pymongo import MongoClient
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    return MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]


# Quote
class TestQuote:
    def test_quote_20(self):
        r = requests.get(f"{API}/withdraw/quote", params={"amount": 20}, headers=H)
        assert r.status_code == 200, r.text
        q = r.json()
        assert q["amount"] == 20 and q["fee"] == 1 and q["net_usdt"] == 19 and q["fee_pct"] == 5
        p = q["merq_price"]
        assert p > 0
        assert abs(q["merq_receive"] - 19 / p) < 1e-4
        assert abs(q["merq_fee"] - 1 / p) < 1e-4
        assert q["available"] == 50

    def test_quote_requires_auth(self):
        assert requests.get(f"{API}/withdraw/quote", params={"amount": 20}).status_code in (401, 403)


# Request
class TestRequest:
    def test_below_min(self):
        r = requests.post(f"{API}/withdraw/request", json={"amount": 5}, headers=H)
        assert r.status_code == 400 and "Minimum" in r.json()["detail"]

    def test_above_available(self):
        r = requests.post(f"{API}/withdraw/request", json={"amount": 60}, headers=H)
        assert r.status_code == 400 and "Insufficient" in r.json()["detail"]

    def test_auto_request_and_no_cooldown(self):
        db = _db()
        r = requests.post(f"{API}/withdraw/request", json={"amount": 20}, headers=H)
        assert r.status_code == 200, r.text
        d = r.json()
        print("first:", d)
        assert d["status"] == "payout_failed"
        assert d["fee"] == 1
        w = db.withdrawals.find_one({"_id": d["request_id"]})
        assert w["currency"] == "USDT" and w["amount"] == 20 and w["fee"] == 1 and w["net_usdt"] == 19
        assert w["merq_price"] > 0 and abs(w["net"] - 19 / w["merq_price"]) < 1e-4
        assert abs(w["fee_merq"] - 1 / w["merq_price"]) < 1e-4
        assert w["reason"] == "Treasury wallet does not hold enough MERQ"
        assert db.members.find_one({"_id": ENV["member"]})["available"] == 30
        # second immediately - no cooldown
        r2 = requests.post(f"{API}/withdraw/request", json={"amount": 10}, headers=H)
        assert r2.status_code == 200, r2.text
        print("second:", r2.json())
        assert r2.json()["status"] == "payout_failed"
        assert db.members.find_one({"_id": ENV["member"]})["available"] == 20
        tx = db.transactions.find_one({"meta.request_id": d["request_id"]})
        assert tx["amount"] == -20 and tx["meta"]["currency"] == "USDT"

    def test_history(self):
        r = requests.get(f"{API}/withdraw/history", headers=H)
        assert r.status_code == 200
        h = r.json()
        assert len(h) == 2 and all(x["currency"] == "USDT" for x in h)

    def test_admin_withdrawals_list(self):
        r = requests.get(f"{API}/admin/withdrawals", headers=HA)
        print(r.status_code, r.text[:600])
        assert r.status_code == 200
