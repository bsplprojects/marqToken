"""Quick API check: temp SUPER_ADMIN wallet -> new admin endpoints. Cleans up after."""
import os, sys, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0] + "/api"
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
acct = Account.create()
a = acct.address.lower()
db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "tmp"})
db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
try:
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    H = {"Authorization": f"Bearer {tok}"}
    for method, path, body in [("get", "/admin/token-rate", None), ("get", "/admin/port-income-rules", None),
                               ("put", "/admin/port-income-rules", {"entry_daily_pct": 0.3}),
                               ("post", "/admin/port-income/accrue", None), ("get", "/admin/income-report?page=1", None),
                               ("get", "/admin/income-report?stream=port_level_income", None),
                               ("get", "/admin/income-report/export", None), ("get", "/income/celebrations", None),
                               ("get", "/income/port-info", None), ("get", "/income/stream/port_rank_rewards", None),
                               ("get", "/ports/status", None), ("get", "/swap/config", None)]:
        r = getattr(requests, method)(API + path, headers=H, json=body)
        print(r.status_code, path, r.text[:160].replace("\n", " "))
finally:
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})
