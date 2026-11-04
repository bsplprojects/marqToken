"""Iteration 8: admin withdrawal state machine (reject single-use/atomic, release/hold transitions), quote validation.
Requires `python tests/atlas_withdraw_env.py setup` (temp member available=50). Never touches real withdrawals."""
import json, os
from concurrent.futures import ThreadPoolExecutor
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


DB = _db()


def avail():
    return DB.members.find_one({"_id": ENV["member"]})["available"]


def act(wid, action, reason="TEST"):
    return requests.post(f"{API}/admin/withdrawals/{wid}/action", json={"action": action, "reason": reason}, headers=HA)


def new_wd(amount):
    r = requests.post(f"{API}/withdraw/request", json={"amount": amount}, headers=H)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["request_id"].startswith("WD-")
    return d


# Quote validation
class TestQuoteValidation:
    @pytest.mark.parametrize("amt", [-5, 0])
    def test_quote_nonpositive_400(self, amt):
        r = requests.get(f"{API}/withdraw/quote", params={"amount": amt}, headers=H)
        assert r.status_code == 400, r.text
        assert "greater than 0" in r.json()["detail"]

    def test_quote_positive_ok(self):
        r = requests.get(f"{API}/withdraw/quote", params={"amount": 20}, headers=H)
        assert r.status_code == 200 and r.json()["fee"] == 1


# State machine
class TestStateMachine:
    def test_full_transitions(self):
        a0 = avail()
        d = new_wd(10)
        wid = d["request_id"]
        assert d["status"] == "payout_failed"  # treasury has 0 MERQ
        assert avail() == pytest.approx(a0 - 10)
        # release only from under_review
        r = act(wid, "release"); assert r.status_code == 400, r.text
        # hold from payout_failed ok, hold again 400
        r = act(wid, "hold"); assert r.status_code == 200, r.text
        assert DB.withdrawals.find_one({"_id": wid})["status"] == "under_review"
        r = act(wid, "hold"); assert r.status_code == 400, r.text
        # release -> pending ; release again 400
        r = act(wid, "release"); assert r.status_code == 200, r.text
        assert DB.withdrawals.find_one({"_id": wid})["status"] == "pending"
        r = act(wid, "release"); assert r.status_code == 400
        # hold from pending ok, then release back
        assert act(wid, "hold").status_code == 200
        assert act(wid, "release").status_code == 200
        # reject once -> refund ; reject again -> 400 no refund
        r = act(wid, "reject"); assert r.status_code == 200, r.text
        assert avail() == pytest.approx(a0)
        r = act(wid, "reject"); assert r.status_code == 400, r.text
        assert avail() == pytest.approx(a0)
        # no further transitions from rejected
        for a in ("release", "hold", "approve", "retry"):
            r = act(wid, a)
            assert r.status_code == 400, f"{a}: {r.status_code} {r.text}"
        w = DB.withdrawals.find_one({"_id": wid})
        assert w["status"] == "rejected"
        assert DB.transactions.find_one({"meta.request_id": wid})["status"] == "rejected"
        assert avail() == pytest.approx(a0)

    def test_concurrent_reject_refunds_once(self):
        a0 = avail()
        wid = new_wd(10)["request_id"]
        assert avail() == pytest.approx(a0 - 10)
        with ThreadPoolExecutor(8) as ex:
            codes = list(ex.map(lambda _: act(wid, "reject").status_code, range(8)))
        print("concurrent reject codes:", codes)
        assert codes.count(200) == 1 and codes.count(400) == 7
        assert avail() == pytest.approx(a0)

    def test_invalid_action(self):
        wid = DB.withdrawals.find_one({"address": ENV["member"]})["_id"]
        r = act(wid, "explode")
        assert r.status_code in (400, 422)

    def test_unknown_wid_404(self):
        assert act("WD-TESTNOPE00", "reject").status_code == 404

    def test_member_cannot_act(self):
        wid = DB.withdrawals.find_one({"address": ENV["member"]})["_id"]
        r = requests.post(f"{API}/admin/withdrawals/{wid}/action", json={"action": "reject"}, headers=H)
        assert r.status_code in (401, 403)


# No cooldown under auto-approve threshold
class TestNoCooldown:
    def test_two_immediate(self):
        a0 = avail()
        d1 = new_wd(10); d2 = new_wd(10)
        assert d1["status"] == d2["status"] == "payout_failed"
        assert avail() == pytest.approx(a0 - 20)
