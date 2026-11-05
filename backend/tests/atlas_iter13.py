"""Iter13 Atlas: temp member(+admin) setup/check/cleanup. `python atlas_iter13.py setup|check|cleanup`"""
import os, sys, pickle, json, time, requests
from datetime import datetime, timezone
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
sys.path.insert(0, "/app/backend")
from port_income import next_payout

API = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/") + "/api"
db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
STATE = "/tmp/atlas_iter13.pkl"
SPONSOR = "0x625A2351446c78b664236747899Ba49561a35944"
F = ["direct_count", "team_count", "left_count", "right_count"]
PIDS = ["UP-EA9D9A85", "UP-D14B3689", "UP-125CB391"]
R = []


def ck(name, cond, info=""):
    R.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name, info)


if sys.argv[1] == "setup":
    snap = {m["_id"]: {f: m.get(f, 0) for f in F} for m in db.members.find({}, {f: 1 for f in F})}
    acct = Account.create()
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    r = requests.post(f"{API}/auth/verify", json={"address": acct.address, "nonce": n["nonce"],
                                                  "signature": "0x" + sig.removeprefix("0x"), "ref": SPONSOR}).json()
    a = acct.address.lower()
    db.admin_users.insert_one({"_id": a, "address": acct.address, "role": "SUPER_ADMIN", "status": "active", "name": "TEST_iter13"})
    db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    pickle.dump({"snap": snap, "addr": a, "tok": r["access_token"], "t0": datetime.now(timezone.utc).isoformat()}, open(STATE, "wb"))
    print(r["access_token"]); print(a, file=sys.stderr)

elif sys.argv[1] == "check":
    st = pickle.load(open(STATE, "rb")); H = {"Authorization": f"Bearer {st['tok']}"}
    now = datetime.now(timezone.utc); print("now", now.isoformat())
    before = (db.settings.find_one({"_id": "global"}) or {}).get("port_last_accrual")
    tx_before = db.transactions.count_documents({"type": "port_daily_earnings", "meta.purchase": {"$in": PIDS}})
    s = requests.get(f"{API}/ports/status", headers=H)
    ck("ports/status 200", s.status_code == 200, s.status_code)
    ck("temp member history empty", s.json().get("history") == [])
    time.sleep(10)
    after = (db.settings.find_one({"_id": "global"}) or {}).get("port_last_accrual")
    print("port_last_accrual", before, "->", after)
    dsh = requests.get(f"{API}/member/dashboard", headers=H); ck("member/dashboard 200", dsh.status_code == 200, dsh.status_code)
    for pid in PIDS:
        p = db.port_purchases.find_one({"_id": pid})
        if not p:
            ck(f"{pid} exists", False); continue
        nx = next_payout(datetime.fromisoformat(p["accrual_start"]), p.get("accrued_days", 0)).isoformat()
        txs = list(db.transactions.find({"type": "port_daily_earnings", "meta.purchase": pid}, {"amount": 1, "created_at": 1, "meta.days": 1}))
        print(pid, p["address"][:10], p["amount_usd"], p.get("daily_pct"), "start", p["accrual_start"], "accrued", p.get("accrued_days"),
              "earned", p.get("earned_usd"), "next", nx, "txs", [(t["amount"], t["meta"].get("days"), t["created_at"]) for t in txs])
        ck(f"{pid} next_payout computed", nx == "2026-11-05T19:30:00+00:00" or now.isoformat() > "2026-11-05T19:30", nx)
    tx_after = db.transactions.count_documents({"type": "port_daily_earnings", "meta.purchase": {"$in": PIDS}})
    print("daily tx count for PIDS before/after:", tx_before, tx_after)
    if now.isoformat() < "2026-11-05T19:30":
        ck("no premature payout (before 19:30Z)", tx_after == tx_before)
    # admin unity report rows next_payout_at
    a = requests.get(f"{API}/admin/ports/unity", headers=H)
    ck("admin ports/unity 200", a.status_code == 200, a.status_code)
    rows = {x["id"]: x for x in a.json().get("rows", [])} if a.ok else {}
    for pid in PIDS:
        print(" admin row", pid, rows.get(pid, {}).get("next_payout_at"), rows.get(pid, {}).get("earned_usd"))
        ck(f"admin row {pid} has next_payout_at", rows.get(pid, {}).get("next_payout_at"))
    # gm-tree
    g = requests.get(f"{API}/admin/gm-tree", headers=H)
    ck("gm-tree 200", g.status_code == 200, g.status_code)
    gj = g.json() if g.ok else {}
    print("gm-tree keys", list(gj.keys()), "company_root", gj.get("company_root"), "members", gj.get("members"), "depth", gj.get("depth"))
    print("tree", json.dumps(gj.get("tree"), default=str)[:800])
    print("days", json.dumps(gj.get("days"), default=str)[:800])
    ck("company root 0xc1aca21a", (gj.get("company_root") or "").startswith("0xc1aca21a"))
    ck("members == 2", gj.get("members") == 2, gj.get("members"))
    tree_s = json.dumps(gj.get("tree"))
    ck("children 0x12627aab & 0xeaf52b04 in tree", "0x12627aab" in tree_s and "0xeaf52b04" in tree_s)
    ck("days joins total == members", sum(dd["count"] for dd in gj.get("days", [])) == gj.get("members"))
    child = next((x for x in [db.matrix.find_one({"board": "GM", "member": {"$regex": "^0x12627aab"}})] if x), None)
    if child:
        g2 = requests.get(f"{API}/admin/gm-tree", params={"root": child["member"]}, headers=H)
        ck("gm-tree ?root=child 200", g2.status_code == 200, g2.status_code)
        print("subtree", json.dumps(g2.json().get("tree"), default=str)[:400])
        ck("subtree rooted at child", child["member"][:10] in json.dumps(g2.json().get("tree"))[:300])
        g3 = requests.get(f"{API}/admin/gm-tree", params={"root": child["member"].upper().replace("0X", "0x")}, headers=H)
        ck("gm-tree root case-insensitive", g3.status_code == 200, g3.status_code)
    g4 = requests.get(f"{API}/admin/gm-tree", params={"root": "0x" + "1" * 40}, headers=H)
    ck("gm-tree unknown root 404", g4.status_code == 404, f"{g4.status_code} {g4.text[:100]}")
    g5 = requests.get(f"{API}/admin/gm-tree")
    ck("gm-tree no auth 401/403", g5.status_code in (401, 403), g5.status_code)
    print(f"RESULT {sum(1 for _, c in R if c)}/{len(R)}")

else:
    st = pickle.load(open(STATE, "rb")); a = st["addr"]
    db.admin_users.delete_one({"_id": a})
    db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": a}})
    db.members.delete_one({"_id": a})
    for c in db.list_collection_names():
        q = {"$or": [{"address": a}, {"member": a}, {"admin": a}, {"actor": a}]}
        ids = [x["_id"] for x in db[c].find(q, {"_id": 1})]
        if ids:
            db[c].delete_many({"_id": {"$in": ids}}); print("deleted", c, ids)
    for m in db.members.find({}, {f: 1 for f in F}):
        old = st["snap"].get(m["_id"])
        if not old:
            continue
        inc = {f: old[f] - m.get(f, 0) for f in F if m.get(f, 0) - old[f] == 1}
        if inc:
            db.members.update_one({"_id": m["_id"]}, {"$inc": inc}); print("reverted", m["_id"][:10], inc)
    print("cleanup done")
