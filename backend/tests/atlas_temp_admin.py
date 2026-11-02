"""Temp Atlas admin for UI testing. `python atlas_temp_admin.py setup` -> prints JWT; `... cleanup` -> diff-restore Atlas."""
import os, sys, json, pickle, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/") + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]
STATE = "/tmp/atlas_ui_state.pkl"
KEEP = ["0x625a2351446c78b664236747899ba49561a35944", "0xc1aca21abdfdbf0730e73b56fe949cd2703e63ad"]

if sys.argv[1] == "setup":
    cols = set(db.list_collection_names())
    st = {"cols": cols, "ids": {c: set(x["_id"] for x in db[c].find({}, {"_id": 1})) for c in cols},
          "members": {k: db.members.find_one({"_id": k}) for k in KEEP},
          "owner": db.admin_users.find_one({"_id": KEEP[1]}),
          "admin_addresses": db.settings.find_one({"_id": "global"})["admin_addresses"]}
    pickle.dump(st, open(STATE, "wb"))
    acct = Account.create(); a = acct.address.lower()
    db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "tmp-ui"})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    print(tok)
else:
    st = pickle.load(open(STATE, "rb"))
    for c in db.list_collection_names():
        if c not in st["cols"]:
            db[c].drop(); continue
        new = [x["_id"] for x in db[c].find({}, {"_id": 1}) if x["_id"] not in st["ids"][c]]
        if new:
            db[c].delete_many({"_id": {"$in": new}}); print("deleted", c, new)
    for k, doc in st["members"].items():
        if doc: db.members.replace_one({"_id": k}, doc)
    db.admin_users.replace_one({"_id": KEEP[1]}, st["owner"])
    db.settings.update_one({"_id": "global"}, {"$set": {"admin_addresses": st["admin_addresses"]}})
    print("restored")
