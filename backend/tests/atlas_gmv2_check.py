# Atlas PRODUCTION read-only checks for GM v2 + income-rules admin API. Temp SUPER_ADMIN cleaned up by address only.
# usage: python atlas_gmv2_check.py api|setup|cleanup
import os, sys, json, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient

API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/") + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ.get("EXTERNAL_DB_NAME", "merqon_database")]
STATE = "/tmp/atlas_gmv2_admin.json"


def mk_admin():
    acct = Account.create(); a = acct.address.lower()
    db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_tmp-ui"})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    json.dump({"addr": a}, open(STATE, "w"))
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    return requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"],
                                                     "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]


def cleanup():
    a = json.load(open(STATE))["addr"]
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    for c in db.list_collection_names():
        for f in ("_id", "address", "admin", "actor", "member", "admin_address"):
            try:
                r = db[c].delete_many({f: {"$in": [a]}})
                if r.deleted_count: print("cleanup", c, f, r.deleted_count)
            except Exception:
                pass
    print("cleanup done for", a)


if sys.argv[1] == "setup":
    print(mk_admin())
elif sys.argv[1] == "cleanup":
    cleanup()
else:
    s0 = db.settings.find_one({"_id": "global"})
    print("gm_v2_rebuilt:", s0.get("gm_v2_rebuilt"), "| saved income_rules keys:", list((s0.get("income_rules") or {}).keys()))
    print("saved PO:", (s0.get("income_rules") or {}).get("partner_onboarding_usd"), (s0.get("income_rules") or {}).get("partner_onboarding_pct"),
          "MB1 levels:", ((s0.get("income_rules") or {}).get("mb_boards") or [{}])[0].get("levels"))
    gm = list(db.matrix.find({"board": "GM"}))
    print("GM nodes:", [(x["member"], x["parent"], x["children"]) for x in gm])
    # qualified members by rule
    tp = set(db.techpass.distinct("address", {"status": "confirmed"}))
    qual = []
    for a in tp:
        dirs = [x["_id"] for x in db.members.find({"sponsor": a}, {"_id": 1})]
        act = [x for x in dirs if x in tp]
        if len(act) >= 2: qual.append((a, len(act)))
    print("Members w/ TP & >=2 active directs:", qual)
    print("GM members (non-root) == qualified:", sorted(x["member"] for x in gm if x["parent"]) == sorted(a for a, _ in qual))
    tok = mk_admin(); H = {"Authorization": f"Bearer {tok}"}
    try:
        r = requests.get(f"{API}/admin/income-rules", headers=H); j = r.json()
        print("GET", r.status_code, "keys:", list(j.keys()))
        print("rules.partner_onboarding_usd:", j["rules"].get("partner_onboarding_usd"), "| pct present:", "partner_onboarding_pct" in j["rules"],
              "| gm_min_directs:", j["rules"].get("gm_min_directs"), "| gm_members:", j.get("gm_members"), "| recent in resp:", "recent" in j)
        bad = requests.put(f"{API}/admin/income-rules", headers=H, json={**j["rules"], "partner_onboarding_usd": -1})
        print("PUT po=-1:", bad.status_code, bad.text[:120])
        bad2 = requests.put(f"{API}/admin/income-rules", headers=H, json={**j["rules"], "partner_onboarding_usd": "abc"})
        print("PUT po=abc:", bad2.status_code, bad2.text[:120])
        bad3 = requests.put(f"{API}/admin/income-rules", headers=H, json={**j["rules"], "gm_min_directs": -1})
        print("PUT gm_min_directs=-1:", bad3.status_code, bad3.text[:120])
        noauth = requests.get(f"{API}/admin/income-rules")
        print("GET no auth:", noauth.status_code)
        s1 = db.settings.find_one({"_id": "global"})
        print("income_rules unchanged after bad PUTs:", s0.get("income_rules") == s1.get("income_rules"))
    finally:
        cleanup()
