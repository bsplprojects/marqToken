# READ-ONLY verification of the PO $60->$50 / MB1 $50 deletion correction on Atlas
import os
from collections import defaultdict
from pymongo import MongoClient

db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
ok = True
def chk(name, cond, extra=""):
    global ok
    ok &= bool(cond)
    print(("PASS " if cond else "FAIL ") + name, extra)

chk("no PO tx amount 60", db.transactions.count_documents({"type": "tp_partner_onboarding", "amount": 60.0}) == 0)
corr = db.transactions.count_documents({"type": "tp_partner_onboarding", "amount": 50.0, "meta.corrected_from": 60.0})
chk("9 corrected PO tx", corr == 9, corr)
chk("no MB1 50 tx", db.transactions.count_documents({"type": "tp_momentum_booster", "amount": 50.0, "meta.board": "MB1"}) == 0)
b = db.corrections_backup.find_one({"_id": "po_mb1_2026_11"})
chk("backup exists", b is not None, b and f"po={len(b['po_tx'])} mb1={len(b['mb1_tx'])} members={len(b['members'])} mb_state={len(b['mb_state'])}")
s = db.settings.find_one({"_id": "global"}) or {}
chk("settings flag", s.get("corrections", {}).get("po_mb1_2026_11"), s.get("corrections"))
chk("audit log", db.audit_logs.find_one({"_id": "corr-po_mb1_2026_11"}) is not None)
exp = {"0x433511f8": 50.0, "0x625a2351": 60.0, "0x12627aab": 182.6, "0x44dbc6a4": 50.0, "0xce706be3": 55.0,
       "0xc1aca21a": 80.0, "0xeaf52b04": 249.15}
for pre, v in exp.items():
    m = db.members.find_one({"_id": {"$regex": "^" + pre}})
    got = round(m.get("available", 0), 2) if m else None
    chk(f"balance {pre}", got is not None and abs(got - v) < 0.01, f"got={got} exp={v}")
# backup original vs now: deduction consistency
if b:
    orig = {m["_id"]: m for m in b["members"]}
    ded = defaultdict(float)
    for t in b["po_tx"]: ded[t["address"]] += 10
    for t in b["mb1_tx"]: ded[t["address"]] += 50
    for a, o in orig.items():
        now = db.members.find_one({"_id": a})
        print(f"  {a[:10]} orig_avail={round(o.get('available',0),2)} ded={ded[a]} now={round(now.get('available',0),2)} delta={round(o.get('available',0)-now.get('available',0),2)}")
for key in ["tp_partner_onboarding", "tp_momentum_booster"]:
    sums = defaultdict(float)
    for t in db.transactions.find({"type": key}, {"address": 1, "amount": 1}):
        sums[t["address"]] += t["amount"]
    bad = []
    for m in db.members.find({f"income_usd.{key}": {"$exists": True}}, {f"income_usd.{key}": 1}):
        v = m["income_usd"][key]
        if abs(v - sums.get(m["_id"], 0)) > 0.01:
            bad.append((m["_id"][:10], v, sums.get(m["_id"], 0)))
    missing = [a[:10] for a in sums if not db.members.find_one({"_id": a, f"income_usd.{key}": {"$exists": True}})]
    chk(f"income_usd.{key} == sum tx", not bad and not missing, f"bad={bad} missing={missing}")
    # also legacy income.<key>
    bad2 = [(m["_id"][:10], m["income"][key], sums.get(m["_id"], 0)) for m in db.members.find({f"income.{key}": {"$exists": True}}, {f"income.{key}": 1})
            if abs(m["income"][key] - sums.get(m["_id"], 0)) > 0.01]
    print(f"  info income.{key} mismatches:", bad2)
neg = list(db.members.find({"available": {"$lt": 0}}, {"available": 1}))
chk("no negative balances", not neg, neg)
print("ALL OK" if ok else "SOME FAILED")
