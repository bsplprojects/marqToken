"""Iteration 6: second admin lookup + TechPass confirmed -> member status active (Atlas).
Run AFTER `python atlas_temp_admin.py setup` (snapshot) and clean with `python atlas_temp_admin.py cleanup`.
Run with -n 0 (serial)."""
import os, time, subprocess, requests, pytest
from datetime import datetime, timezone
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
BASE_URL = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/")
API = BASE_URL + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]
SPONSOR = "0x625A2351446c78b664236747899Ba49561a35944"
ADMIN2 = "0x25549df8B08D02740BEB4004BB43f5De88b1626f"
S = {}


def login(acct, ref=None):
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    body = {"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}
    if ref:
        body["ref"] = ref
    return requests.post(f"{API}/auth/verify", json=body)


# --- Second admin wallet ---
def test_admin2_in_db():
    au = db.admin_users.find_one({"_id": ADMIN2.lower()})
    assert au and au["role"] == "SUPER_ADMIN" and au["status"] == "active"
    assert ADMIN2.lower() in db.settings.find_one({"_id": "global"})["admin_addresses"]


def test_admin2_lookup_no_sponsor_required():
    r = requests.get(f"{API}/auth/lookup/{ADMIN2}")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["sponsor_required"] is False and j["registered"] is False


def test_admin2_nonce_ok():
    r = requests.post(f"{API}/auth/nonce", json={"address": ADMIN2})
    assert r.status_code == 200 and "nonce" in r.json()
    db.nonces.delete_many({"address": ADMIN2.lower()})


def test_random_wallet_requires_sponsor():
    r = requests.get(f"{API}/auth/lookup/{Account.create().address}")
    assert r.json()["sponsor_required"] is True


# --- TechPass activation ---
def test_signup_inactive():
    acct = Account.create()
    r = login(acct, SPONSOR)
    assert r.status_code == 200, r.text
    S["acct"], S["tok"] = acct, r.json()["access_token"]
    open("/tmp/tp_member_jwt", "w").write(S["tok"])
    p = requests.get(f"{API}/member/profile", headers={"Authorization": f"Bearer {S['tok']}"}).json()
    assert p["status"] == "inactive" and p["sponsor"].lower() == SPONSOR.lower()


def test_techpass_backfill_activates():
    a = S["acct"].address.lower()
    now = datetime.now(timezone.utc).isoformat()
    db.techpass.insert_one({"_id": "TEST_tp1", "address": a, "status": "confirmed", "price_usd": 120, "merq_amount": 1,
                            "created_at": now, "verified_at": now, "tx_hash": "0xtest", "receive_wallet": "0x0",
                            "token_address": "0x0"})
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=True)
    for _ in range(40):
        time.sleep(3)
        try:
            if requests.get(f"{API}/auth/lookup/{SPONSOR}", timeout=5).status_code == 200:
                break
        except Exception:
            pass
    time.sleep(3)
    h = {"Authorization": f"Bearer {S['tok']}"}
    p = requests.get(f"{API}/member/profile", headers=h).json()
    assert p["status"] == "active", p
    dash = requests.get(f"{API}/member/dashboard", headers=h).json()
    assert dash["status"] == "active"
    tp = db.techpass.find_one({"_id": "TEST_tp1"})
    assert tp.get("income_processed") is True
    m = db.members.find_one({"_id": a})
    assert m.get("activated_at")
