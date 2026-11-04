"""Temp member + temp admin on Atlas for withdraw/UI testing WITHOUT touching real members.
`python atlas_withdraw_env.py setup` -> writes /tmp/wd_env.json {member_jwt, admin_jwt, member, admin}
`python atlas_withdraw_env.py cleanup` -> deletes only docs belonging to the temp wallets; verifies counts.
Member is signed up while its address is temporarily in admin_addresses (no sponsor => no upline count changes)."""
import os, sys, json, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/") + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]
ENV = "/tmp/wd_env.json"


def login(acct):
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    r = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"],
                                                  "signature": "0x" + sig.removeprefix("0x")})
    r.raise_for_status()
    return r.json()["access_token"]


if sys.argv[1] == "setup":
    counts = {c: db[c].count_documents({}) for c in db.list_collection_names()}
    adm, mem = Account.create(), Account.create()
    a, mm = adm.address.lower(), mem.address.lower()
    json.dump({"admin": a, "member": mm, "counts": counts, "admin_pk": adm.key.hex(), "member_pk": mem.key.hex()}, open(ENV, "w"))
    db.admin_users.insert_one({"_id": a, "address": adm.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_tmp"})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": {"$each": [a, mm]}}})
    try:
        admin_jwt = login(adm)
        member_jwt = login(mem)
    finally:
        db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": mm}})
    db.members.update_one({"_id": mm}, {"$set": {"available": 50.0, "status": "active"}})
    db.techpass.insert_one({"_id": "TEST_TP_" + mm[2:10], "address": mm, "price_usd": 120.0, "status": "confirmed",
                            "income_processed": True, "created_at": "2026-01-01T00:00:00+00:00", "tx_hash": "TEST"})
    env = json.load(open(ENV)); env.update(admin_jwt=admin_jwt, member_jwt=member_jwt); json.dump(env, open(ENV, "w"))
    print(json.dumps({k: env[k] for k in ("admin", "member")}))
else:
    env = json.load(open(ENV))
    a, mm = env["admin"], env["member"]
    wids = [w["_id"] for w in db.withdrawals.find({"address": mm}, {"_id": 1})]
    out = {
        "withdrawals": db.withdrawals.delete_many({"address": mm}).deleted_count,
        "transactions": db.transactions.delete_many({"$or": [{"address": mm}, {"meta.request_id": {"$in": wids}}]}).deleted_count,
        "techpass": db.techpass.delete_many({"address": mm}).deleted_count,
        "nonces": db.nonces.delete_many({"address": {"$in": [a, mm]}}).deleted_count,
        "audit_logs": db.audit_logs.delete_many({"$or": [{"admin_address": {"$in": [a, mm]}},
                                                         {"target": {"$in": [a, mm] + wids}}]}).deleted_count,
        "members": db.members.delete_many({"_id": {"$in": [a, mm]}}).deleted_count,
        "admin_users": db.admin_users.delete_many({"_id": {"$in": [a, mm]}}).deleted_count,
        "matrix": db.matrix.delete_many({"member": {"$in": [a, mm]}}).deleted_count,
    }
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": {"$in": [a, mm]}}})
    print("deleted:", out)
    now = {c: db[c].count_documents({}) for c in db.list_collection_names()}
    diff = {c: (env["counts"].get(c), now.get(c)) for c in set(now) | set(env["counts"]) if env["counts"].get(c) != now.get(c)}
    print("count diffs vs setup:", diff)
