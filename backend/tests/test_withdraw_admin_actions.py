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


# Iteration 9: approve is atomic; approve vs reject race; reject not allowed from 'approved'
def _pending_wd(amount=10):
    wid = new_wd(amount)["request_id"]  # auto -> payout_failed (0 MERQ treasury)
    assert act(wid, "hold").status_code == 200
    assert act(wid, "release").status_code == 200
    assert DB.withdrawals.find_one({"_id": wid})["status"] == "pending"
    return wid


class TestApproveRejectRace:
    @pytest.mark.parametrize("run", range(6))
    def test_approve_vs_reject(self, run):
        a0 = avail()
        wid = _pending_wd(10)
        a1 = avail()
        assert a1 == pytest.approx(a0 - 10)
        order = ["approve", "reject"] if run % 2 == 0 else ["reject", "approve"]
        with ThreadPoolExecutor(2) as ex:
            res = dict(zip(order, ex.map(lambda a: act(wid, a), order)))
        codes = {k: v.status_code for k, v in res.items()}
        w = DB.withdrawals.find_one({"_id": wid})
        a2 = avail()
        print(f"run {run}: codes={codes} final={w['status']} refund={a2 - a1} tx_hash={w.get('tx_hash')}")
        assert not w.get("tx_hash"), "payout must never have a tx hash (0 MERQ treasury)"
        if codes["reject"] == 200 and codes["approve"] == 200:
            # only legitimate if approve fully finished (payout_failed) before reject ran
            assert w["status"] == "rejected" and res["approve"].json()["status"] == "payout_failed"
            assert a2 == pytest.approx(a0)
        elif codes["reject"] == 200:
            assert codes["approve"] == 400
            assert w["status"] == "rejected" and a2 == pytest.approx(a0)
            assert not w.get("approved_by"), "approve must not have transitioned after reject"
        else:
            assert codes["approve"] == 200 and codes["reject"] == 400
            assert w["status"] == "payout_failed" and a2 == pytest.approx(a1)  # no refund

    def test_reject_from_approved_400(self):
        wid = _pending_wd(10)
        a1 = avail()
        DB.withdrawals.update_one({"_id": wid, "address": ENV["member"]}, {"$set": {"status": "approved"}})
        r = act(wid, "reject")
        assert r.status_code == 400, r.text
        assert DB.withdrawals.find_one({"_id": wid})["status"] == "approved"
        assert avail() == pytest.approx(a1)
        # 'processing' also not rejectable
        DB.withdrawals.update_one({"_id": wid, "address": ENV["member"]}, {"$set": {"status": "processing"}})
        assert act(wid, "reject").status_code == 400
        assert avail() == pytest.approx(a1)
        DB.withdrawals.update_one({"_id": wid, "address": ENV["member"]}, {"$set": {"status": "payout_failed"}})
