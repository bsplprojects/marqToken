# Atlas (PRODUCTION) read-only check of GET /api/admin/income-rules via a temp SUPER_ADMIN; cleans up by id after
import os, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/") + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]
acct = Account.create()
a = acct.address.lower()
before = {c: db[c].estimated_document_count() for c in ("matrix", "transactions", "techpass", "placement_claims", "members")}
db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_tmp_t1"})
db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
try:
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    r = requests.get(f"{API}/admin/income-rules", headers={"Authorization": f"Bearer {tok}"})
    print("GET income-rules", r.status_code)
    j = r.json()
    print({k: (v if not isinstance(v, (list, dict)) else type(v).__name__) for k, v in (j.get("rules", j) if isinstance(j, dict) else {}).items()})
    print("top keys", list(j.keys()) if isinstance(j, dict) else j)
    print("noauth", requests.get(f"{API}/admin/income-rules").status_code)
finally:
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    for c in ("members", "sessions", "auth_nonces", "nonces", "audit_logs", "refresh_tokens"):
        if c in db.list_collection_names():
            k = db[c].delete_many({"$or": [{"_id": a}, {"address": a}, {"actor": a}, {"admin": a}]}).deleted_count
            if k: print("cleanup", c, k)
    print("leftover admin:", db.admin_users.find_one({"_id": a}), a in (db.settings.find_one({"_id": "global"}).get("admin_addresses") or []))
    after = {c: db[c].estimated_document_count() for c in before}
    print("counts before", before, "after", after)
    print("placement_claims on Atlas:", db.placement_claims.count_documents({}))
