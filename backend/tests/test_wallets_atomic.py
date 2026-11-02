# Atomic PUT /api/admin/wallets, swap rpc validation, treasury status (no on-chain sends)
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
TREASURY = "0x162f2eaB23640181cE1c035Eb9852cfD7d694CE3"
PK = os.environ.get("TREASURY_PRIVATE_KEY", "").strip().removeprefix("0x").lower()
KEYS = ("swap", "techpass", "ports")


def snap():
    return db.settings.find_one({"_id": "global"}, {k: 1 for k in KEYS})


@pytest.fixture(scope="module")
def H():
    s = snap()
    acct = Account.create()
    a = acct.address.lower()
    db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_tmp"})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"],
                                                     "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    yield {"Authorization": f"Bearer {tok}"}
    for k in KEYS:
        if s.get(k) is None:
            db.settings.update_one({"_id": "global"}, {"$unset": {k: ""}})
        else:
            db.settings.update_one({"_id": "global"}, {"$set": {k: s[k]}})
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})
    assert snap() == s


def body_from(H):
    w = requests.get(f"{API}/admin/wallets", headers=H).json()
    return {**{k: w["swap"][k] for k in ("merq_token_address", "usdt_token_address", "wbnb_address", "router_address",
                                          "factory_address", "rpc_url", "fee_wallet", "fee_pct", "default_slippage_pct")},
            "techpass_wallet": w["techpass_receive_wallet"], "entry_wallet": w["ports"]["entry"]["receive_wallet"],
            "unity_wallet": w["ports"]["unity"]["receive_wallet"]}


@pytest.mark.parametrize("override,msg", [
    ({"unity_wallet": "abc", "entry_wallet": DEAD, "fee_wallet": DEAD}, "Unity Port Receive Wallet is not a valid address"),
    ({"rpc_url": "http://x", "entry_wallet": DEAD}, "https://"),
    ({"fee_pct": 50, "entry_wallet": DEAD}, "Swap Fee"),
    ({"techpass_wallet": "", "entry_wallet": DEAD}, "required"),
    ({"merq_token_address": "nothex", "entry_wallet": DEAD}, "MERQ Token Contract"),
    ({"default_slippage_pct": "x", "entry_wallet": DEAD}, "number"),
])
def test_atomic_invalid_nothing_saved(H, override, msg):
    before = snap()
    r = requests.put(f"{API}/admin/wallets", headers=H, json={**body_from(H), **override})
    assert r.status_code == 400, r.text
    assert msg in r.json()["detail"], r.json()
    assert snap() == before


def test_swap_non_https_rpc_400(H):
    before = snap()
    r = requests.put(f"{API}/admin/swap", headers=H, json={"rpc_url": "http://bsc.example"})
    assert r.status_code == 400 and "https://" in r.json()["detail"]
    assert snap()["swap"] == before["swap"]


def test_valid_save_roundtrip(H):
    b = body_from(H)
    r = requests.put(f"{API}/admin/wallets", headers=H, json={**b, "entry_wallet": DEAD.lower()})
    assert r.status_code == 200 and r.json()["ok"] is True
    w = requests.get(f"{API}/admin/wallets", headers=H).json()
    assert w["ports"]["entry"]["receive_wallet"] == DEAD  # checksummed
    assert w["ports"]["unity"]["receive_wallet"] == b["unity_wallet"]
    assert w["techpass_receive_wallet"] == b["techpass_wallet"]
    r = requests.put(f"{API}/admin/wallets", headers=H, json={**b, "entry_wallet": ""})
    assert r.status_code == 200
    assert requests.get(f"{API}/admin/wallets", headers=H).json()["ports"]["entry"]["receive_wallet"] == ""


def test_treasury_in_wallets(H):
    r = requests.get(f"{API}/admin/wallets", headers=H)
    t = r.json()["treasury"]
    assert t["configured"] is True and t["key_set"] is True
    assert t["address"] == TREASURY
    assert isinstance(t["bnb_balance"], (int, float)), t
    assert t["merq_balance"] is None or isinstance(t["merq_balance"], (int, float))
    assert PK and PK not in r.text.lower()


def test_withdrawals_treasury(H):
    r = requests.get(f"{API}/admin/withdrawals/treasury", headers=H)
    assert r.status_code == 200, r.text
    j = r.json()
    print(j)
    assert j.get("configured") is True
    assert PK not in r.text.lower()


def test_no_auth():
    assert requests.put(f"{API}/admin/wallets", json={}).status_code in (401, 403)
