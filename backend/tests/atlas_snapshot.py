"""Snapshot Atlas merqon_database: collection counts + key docs. Usage: python atlas_snapshot.py [out.json]"""
import os, sys, json
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]
snap = {"counts": {c: db[c].count_documents({}) for c in sorted(db.list_collection_names())}}
snap["members"] = list(db.members.find({}))
snap["admin_users"] = list(db.admin_users.find({}))
snap["settings"] = db.settings.find_one({"_id": "global"})
out = json.dumps(snap, default=str, sort_keys=True)
if len(sys.argv) > 1:
    open(sys.argv[1], "w").write(out)
print(json.dumps(snap["counts"], indent=1))
print("members:", [m["_id"] for m in snap["members"]])
print("admins:", [(a["_id"], a.get("status")) for a in snap["admin_users"]])
print("admin_addresses:", snap["settings"].get("admin_addresses"))
