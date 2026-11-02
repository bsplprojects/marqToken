"""Round-trip PUT /api/admin/wallets with unchanged values + invalid cases. Temp admin cleaned up."""
import os, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0] + "/api"
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
before = db.settings.find_one({"_id": "global"}, {"swap": 1, "techpass": 1, "ports": 1})
acct = Account.create(); a = acct.address.lower()
db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "tmp"})
db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
try:
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    H = {"Authorization": f"Bearer {tok}"}
    w = requests.get(f"{API}/admin/wallets", headers=H).json()
    body = {**{k: w["swap"][k] for k in ("merq_token_address", "usdt_token_address", "wbnb_address", "router_address", "factory_address", "rpc_url", "fee_wallet", "fee_pct", "default_slippage_pct")},
            "techpass_wallet": w["techpass_receive_wallet"], "entry_wallet": w["ports"]["entry"]["receive_wallet"], "unity_wallet": w["ports"]["unity"]["receive_wallet"]}
    for label, b in [("unchanged", body), ("bad unity", {**body, "unity_wallet": "abc"}), ("bad rpc", {**body, "rpc_url": "http://x"}),
                     ("bad fee", {**body, "fee_pct": 50})]:
        r = requests.put(f"{API}/admin/wallets", headers=H, json=b)
        print(label, r.status_code, r.text[:120])
    after = db.settings.find_one({"_id": "global"}, {"swap": 1, "techpass": 1, "ports": 1})
    print("swap/techpass identical:", before["swap"] == after["swap"], before["techpass"] == after["techpass"])
    print("ports now:", after.get("ports"))
finally:
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})
