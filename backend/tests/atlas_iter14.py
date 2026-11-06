# Iteration 14: member detail 200 / view-as token read-only / 10-level rules / whole-team dashboard (Atlas, read-only)
import os, sys, json, requests
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient

API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0] + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
acct = Account.create(); a = acct.address.lower()
db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_tmp14"})
db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
res = []
def chk(name, cond, info=""):
    res.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name, info)
try:
    rules_before = db.settings.find_one({"_id": "global"}).get("port_income_rules")
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    tok = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}).json()["access_token"]
    H = {"Authorization": f"Bearer {tok}"}
    for addr in ["0x415a795b3EBC196a2b4466151738BaacE451Ed5A", "0xeaf52b04e341793e2b9e295dfa5d4f55cd10d121",
                 "0x12627aabc2d210ae7014215585d21fe0848bf9f2", "0x625a2351446c78b664236747899ba49561a35944"]:
        r = requests.get(f"{API}/admin/members/{addr}", headers=H)
        j = r.json() if r.ok else {}
        chk(f"member_detail {addr[:10]}", r.status_code == 200, f"{r.status_code} acts={len(j.get('activity', []))} income_keys={list(j.get('financial', {}).get('income', {}).keys())[:6]}")
        if j:
            notx = [x for x in j["activity"] if not x.get("tx_hash")]
            print("   types:", sorted({x['type'] for x in j['activity']}), "no-tx rows:", len(notx))
    # ALL members with incomes sweep
    addrs = [x["_id"] for x in db.members.find({"is_admin": {"$ne": True}}, {"_id": 1})]
    bad = []
    for ad in addrs:
        r = requests.get(f"{API}/admin/members/{ad}", headers=H)
        if r.status_code != 200: bad.append((ad, r.status_code))
    chk(f"member_detail sweep all {len(addrs)} members", not bad, str(bad[:5]))
    r = requests.get(f"{API}/admin/members/0x0000000000000000000000000000000000000001", headers=H)
    chk("member_detail unknown -> 404", r.status_code == 404)
    # view-as
    tgt = "0x625a2351446c78b664236747899ba49561a35944"
    r = requests.post(f"{API}/admin/members/{tgt}/view-as", headers=H)
    chk("view-as 200", r.status_code == 200 and r.json().get("expires_in_minutes") == 30, r.text[:120])
    vt = r.json()["token"]; VH = {"Authorization": f"Bearer {vt}"}
    al = db.audit_logs.find_one({"admin_address": a, "action": "view_as_member", "target": tgt})
    chk("view-as audited", al is not None)
    r = requests.get(f"{API}/member/dashboard", headers=VH)
    net = r.json().get("network", {}) if r.ok else {}
    chk("view dashboard total_team 32 active 29", net.get("total_team") == 32 and net.get("active_members") == 29, json.dumps(net))
    # independent DB check of whole downline
    agg = list(db.members.aggregate([{"$match": {"_id": tgt}}, {"$graphLookup": {"from": "members", "startWith": "$_id",
           "connectFromField": "_id", "connectToField": "sponsor", "as": "t"}}, {"$project": {"t": {"_id": 1, "status": 1}}}]))
    t = agg[0]["t"]; print("   DB downline", len(t), sum(1 for x in t if x.get("status") == "active"), "direct", db.members.find_one({"_id": tgt})["direct_count"])
    for p, body in [("/withdraw/request", {"amount": 1}), ("/techpass/quote", {}), ("/auth/nonce", None)]:
        if body is None: continue
        r = requests.post(f"{API}{p}", headers=VH, json=body)
        chk(f"view-as POST {p} -> 403", r.status_code == 403 and "View-only" in r.text, f"{r.status_code} {r.text[:100]}")
    for p in ["/member/profile", "/income/history", "/transactions"]:
        r = requests.get(f"{API}{p}", headers=VH)
        chk(f"view-as GET {p}", r.status_code in (200, 404), f"{r.status_code}")
    r = requests.get(f"{API}/admin/me", headers=VH)
    chk("view-as token on /admin/me (non-admin member) -> 403", r.status_code == 403, str(r.status_code))
    r = requests.get(f"{API}/member/dashboard", headers={"Authorization": f"Bearer {vt}x"})
    chk("tampered token 401", r.status_code == 401)
    # income history labels
    r = requests.get(f"{API}/income/history", headers=VH)
    if r.ok:
        j = r.json(); items = j if isinstance(j, list) else j.get("items", j)
        print("   income history sample:", json.dumps(items[:2] if isinstance(items, list) else items)[:400])
    # rules
    r = requests.get(f"{API}/admin/port-income-rules", headers=H)
    lp = r.json()["rules"]["level_pcts"]
    chk("rules level_pcts 10", lp == [25, 15, 10, 5, 4, 3, 2, 1, 1, 1], str(lp))
    chk("defaults level_pcts 10", len(r.json()["defaults"]["level_pcts"]) == 10)
    body = dict(r.json()["rules"]); body["level_pcts"] = lp[:8]
    r2 = requests.put(f"{API}/admin/port-income-rules", headers=H, json=body)
    chk("PUT 8 levels -> 400", r2.status_code == 400, r2.text[:100])
    chk("rules unchanged in DB", db.settings.find_one({"_id": "global"}).get("port_income_rules") == rules_before)
finally:
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})
    db.nonces.delete_many({"address": {"$in": [a, acct.address]}})
    db.audit_logs.delete_many({"admin_address": a})
    print(f"\n{sum(p for _, p in res)}/{len(res)} passed")
