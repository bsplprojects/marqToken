"""One-time correction (2026-11): PO $60 -> $50 (take back $10) and delete MB1 Level-1 $50 payouts (take back $50).
Backs up every touched document to db.corrections_backup first. Idempotent via settings.corrections.po_mb1_2026_11."""
import os
from collections import defaultdict
from datetime import datetime, timezone
from pymongo import MongoClient

db = MongoClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
KEY = "po_mb1_2026_11"
if (db.settings.find_one({"_id": "global"}) or {}).get("corrections", {}).get(KEY):
    raise SystemExit("already applied")

now = datetime.now(timezone.utc).isoformat()
po = list(db.transactions.find({"type": "tp_partner_onboarding", "amount": 60.0}))
mb = list(db.transactions.find({"type": "tp_momentum_booster", "amount": 50.0, "meta.board": "MB1"}))
members = {a: db.members.find_one({"_id": a}) for a in {t["address"] for t in po + mb}}
states = {a: db.mb_state.find_one({"_id": f"MB1:{a}"}) for a in {t["address"] for t in mb}}
db.corrections_backup.insert_one({"_id": KEY, "created_at": now, "po_tx": po, "mb1_tx": mb,
                                  "members": list(members.values()), "mb_state": [s for s in states.values() if s]})

po_ded, mb_ded = defaultdict(float), defaultdict(float)
for t in po:
    db.transactions.update_one({"_id": t["_id"]}, {"$set": {"amount": 50.0, "meta.usd": 50.0, "meta.corrected_from": 60.0}})
    po_ded[t["address"]] += 10.0
for t in mb:
    db.transactions.delete_one({"_id": t["_id"]})
    mb_ded[t["address"]] += 50.0
for a in members:
    p, m = po_ded[a], mb_ded[a]
    db.members.update_one({"_id": a}, {"$inc": {"available": -(p + m), "income.tp_partner_onboarding": -p, "income_usd.tp_partner_onboarding": -p,
                                                "income.tp_momentum_booster": -m, "income_usd.tp_momentum_booster": -m}})
for a, s in states.items():
    if s:
        db.mb_state.update_one({"_id": s["_id"]}, {"$set": {"net": max(0.0, s.get("net", 0.0) - mb_ded[a])}})
db.audit_logs.insert_one({"_id": f"corr-{KEY}", "admin_address": "system", "admin_name": "Correction", "action": "income_correction",
                          "module": "income", "target": None, "created_at": now,
                          "details": {"po_records": len(po), "mb1_records_deleted": len(mb),
                                      "deducted": {a: po_ded[a] + mb_ded[a] for a in members}}})
db.settings.update_one({"_id": "global"}, {"$set": {f"corrections.{KEY}": now}})
for a in members:
    m = db.members.find_one({"_id": a})
    print(a[:10], "deducted", po_ded[a] + mb_ded[a], "available now", round(m["available"], 2))
