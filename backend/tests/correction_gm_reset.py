"""One-time: remove all Global Momentum income (take back), clear the GM tree and re-place qualified members (no payouts)."""
import asyncio, os, sys, types
from datetime import datetime, timezone
from collections import defaultdict
from motor.motor_asyncio import AsyncIOMotorClient
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine

KEY = "gm_reset_2026_11"


async def main():
    db = AsyncIOMotorClient(os.environ["EXTERNAL_MONGO_URL"])["merqon_database"]
    s = await db.settings.find_one({"_id": "global"})
    if (s.get("corrections") or {}).get(KEY):
        raise SystemExit("already applied")
    now = datetime.now(timezone.utc).isoformat()
    tx = await db.transactions.find({"type": "tp_global_momentum"}).to_list(10000)
    ev = await db.income_events.find({"kind": {"$in": ["gm_skipped", "gm_entry", "gm_rebuild"]}}).to_list(10000)
    nodes = await db.matrix.find({"board": "GM"}).to_list(10000)
    await db.corrections_backup.insert_one({"_id": KEY, "created_at": now, "gm_tx": tx, "gm_events": ev, "gm_nodes": nodes})
    ded = defaultdict(float)
    for t in tx:
        ded[t["address"]] += t["amount"]
    for a, v in ded.items():
        await db.members.update_one({"_id": a}, {"$inc": {"available": -v, "income.tp_global_momentum": -v, "income_usd.tp_global_momentum": -v}})
    await db.transactions.delete_many({"type": "tp_global_momentum"})
    await db.income_events.delete_many({"kind": {"$in": ["gm_skipped", "gm_entry", "gm_rebuild"]}})
    await db.settings.update_one({"_id": "global"}, {"$unset": {"gm_v2_rebuilt": ""}})

    async def gs(): return await db.settings.find_one({"_id": "global"})
    d = types.SimpleNamespace(db=db, get_settings=gs, iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    await d.income_backfill()  # gm_rebuild: clears GM + claims, re-places qualified members in qualify order, no payouts
    await db.audit_logs.insert_one({"_id": f"corr-{KEY}", "admin_address": "system", "admin_name": "Correction", "action": "gm_reset",
                                    "module": "income", "target": None, "created_at": now, "details": {"deducted": dict(ded), "tx_deleted": len(tx)}})
    await db.settings.update_one({"_id": "global"}, {"$set": {f"corrections.{KEY}": now}})
    print("deducted", dict(ded))
    for x in await db.matrix.find({"board": "GM"}).to_list(100):
        print(x["_id"][:14], "parent", (x.get("parent") or "-")[:10], [c[:10] for c in x["children"]])

asyncio.run(main())
