"""Temp Atlas MEMBER for GM-celebration UI test. `setup` -> prints JWT (signup under 0x625A..., inserts gm_entry celebration);
`cleanup` -> deletes temp member + its celebrations/nonces and reverts counter increments caused by the signup."""
import os, sys, pickle, requests
from datetime import datetime, timezone
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient

API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/") + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
STATE = "/tmp/atlas_temp_member.pkl"
SPONSOR = "0x625A2351446c78b664236747899Ba49561a35944"
F = ["direct_count", "team_count", "left_count", "right_count"]

if sys.argv[1] == "setup":
    snap = {m["_id"]: {f: m.get(f, 0) for f in F} for m in db.members.find({}, {f: 1 for f in F})}
    cols = {c: set(x["_id"] for x in db[c].find({}, {"_id": 1})) for c in db.list_collection_names()}
    acct = Account.create()
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    r = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"],
                                                  "signature": "0x" + sig.removeprefix("0x"), "ref": SPONSOR}).json()
    a = acct.address.lower()
    cid = "TEST_celeb_" + a[2:10]
    db.celebrations.insert_one({"_id": cid, "member": a, "kind": "gm_entry", "title": "Global Momentum", "seen": False,
                                "created_at": datetime.now(timezone.utc).isoformat()})
    pickle.dump({"snap": snap, "cols": cols, "addr": a, "cid": cid}, open(STATE, "wb"))
    print(r["access_token"])
    print(a, cid, file=sys.stderr)
elif sys.argv[1] == "status":
    st = pickle.load(open(STATE, "rb"))
    print(db.celebrations.find_one({"_id": st["cid"]}))
else:
    st = pickle.load(open(STATE, "rb"))
    a = st["addr"]
    print("celebration before delete:", db.celebrations.find_one({"_id": st["cid"]}))
    db.members.delete_one({"_id": a})
    print("del celebs", db.celebrations.delete_many({"member": a}).deleted_count)
    for c in db.list_collection_names():
        q = {"$or": [{"address": a}, {"member": a}, {"address": a.lower()}]}
        new = [x["_id"] for x in db[c].find(q, {"_id": 1}) if x["_id"] not in st["cols"].get(c, set())]
        if new:
            db[c].delete_many({"_id": {"$in": new}}); print("deleted", c, new)
    for m in db.members.find({}, {f: 1 for f in F}):
        old = st["snap"].get(m["_id"])
        if not old:
            continue
        inc = {f: old[f] - m.get(f, 0) for f in F if m.get(f, 0) != old[f]}
        if inc:
            db.members.update_one({"_id": m["_id"]}, {"$inc": inc}); print("reverted", m["_id"][:10], inc)
    print("cleanup done")
