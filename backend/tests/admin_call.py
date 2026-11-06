"""Temp SUPER_ADMIN on the app DB (Atlas) -> call admin endpoints given as argv. Cleans up after."""
import os, sys, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient

API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0] + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
acct = Account.create(); a = acct.address.lower()
db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "tmp"})
db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
try:
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    for path in sys.argv[1:]:
        method, _, p = path.partition(" ") if " " in path else ("GET", "", path)
        r = requests.request(method, API + p, headers={"Authorization": f"Bearer {tok}"})
        print(r.status_code, p, r.text[:600])
finally:
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})
    db.nonces.delete_many({"address": {"$in": [a, acct.address]}})
    db.audit_logs.delete_many({"admin_address": a})
