# Wallets & Contracts admin page API tests (GET /api/admin/wallets, port receive wallets, validation)
import os
import pytest
import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
BASE_URL = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].rstrip("/")
API = BASE_URL + "/api"
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
DEAD = "0x000000000000000000000000000000000000dEaD"
ONES = "0x1111111111111111111111111111111111111111"


@pytest.fixture(scope="module")
def H():
    snap = db.settings.find_one({"_id": "global"}, {"swap": 1, "techpass": 1, "ports": 1})
    acct = Account.create()
    a = acct.address.lower()
    db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_tmp"})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"],
                                                     "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    yield {"Authorization": f"Bearer {tok}"}
    # restore exact original settings + remove temp admin
    for k in ("swap", "techpass", "ports"):
        if snap.get(k) is None:
            db.settings.update_one({"_id": "global"}, {"$unset": {k: ""}})
        else:
            db.settings.update_one({"_id": "global"}, {"$set": {k: snap[k]}})
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})


def test_wallets_get_structure(H):
    r = requests.get(f"{API}/admin/wallets", headers=H)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("merq_token_address", "usdt_token_address", "wbnb_address", "factory_address", "router_address",
              "rpc_url", "fee_wallet", "fee_pct", "default_slippage_pct"):
        assert k in j["swap"], k
    assert j["techpass_receive_wallet"]
    assert set(j["ports"]) >= {"entry", "unity"}
    assert j["ports"]["entry"]["fallback"] == j["techpass_receive_wallet"]
    t = j["treasury"]
    assert "configured" in t and "key_set" in t and "address" in t
    assert "private" not in str(t).lower()


def test_wallets_requires_auth():
    assert requests.get(f"{API}/admin/wallets").status_code in (401, 403)


def test_set_port_wallets_persist(H):
    for port, w in (("entry", DEAD), ("unity", ONES)):
        r = requests.put(f"{API}/admin/ports/{port}/config", headers=H, json={"receive_wallet": w})
        assert r.status_code == 200, r.text
        assert r.json()["config"]["receive_wallet"].lower() == w.lower()
    j = requests.get(f"{API}/admin/wallets", headers=H).json()
    assert j["ports"]["entry"]["receive_wallet"] == DEAD
    assert j["ports"]["unity"]["receive_wallet"] == ONES


@pytest.mark.parametrize("path,body", [
    ("/admin/ports/entry/config", {"receive_wallet": "abc"}),
    ("/admin/ports/unity/config", {"receive_wallet": "0x123"}),
    ("/admin/techpass/config", {"receive_wallet": "abc"}),
    ("/admin/techpass/config", {"receive_wallet": ""}),
    ("/admin/swap", {"fee_wallet": "abc"}),
    ("/admin/swap", {"merq_token_address": "nothex"}),
    ("/admin/swap", {"fee_pct": 50}),
])
def test_invalid_rejected(H, path, body):
    before = requests.get(f"{API}/admin/wallets", headers=H).json()
    r = requests.put(API + path, headers=H, json=body)
    assert r.status_code == 400, r.text
    assert "detail" in r.json()
    after = requests.get(f"{API}/admin/wallets", headers=H).json()
    assert before == after or {k: v for k, v in before.items() if k != "treasury"} == {k: v for k, v in after.items() if k != "treasury"}


def test_restore_port_wallets_empty(H):
    for port in ("entry", "unity"):
        r = requests.put(f"{API}/admin/ports/{port}/config", headers=H, json={"receive_wallet": ""})
        assert r.status_code == 200
    j = requests.get(f"{API}/admin/wallets", headers=H).json()
    assert j["ports"]["entry"]["receive_wallet"] == "" and j["ports"]["unity"]["receive_wallet"] == ""


def test_regression_admin_endpoints(H):
    for p in ("/admin/token-rate", "/admin/port-income-rules", "/admin/income-report?page=1", "/admin/swap", "/admin/techpass"):
        r = requests.get(API + p, headers=H)
        assert r.status_code == 200, f"{p} {r.status_code} {r.text[:200]}"
