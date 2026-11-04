"""Concurrent process_techpass_income on a LOCAL test DB: no GM/MB node may have >2 children; every node linked to its parent."""
import asyncio, os, types, sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine

DBN = "merqon_gm_conc_test"


async def run(n, pre_root):
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    await db.client.drop_database(DBN)
    async def gs(): return {"admin_addresses": ["0xroot"]}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    await db.members.insert_one({"_id": "0xroot", "sponsor": None})
    tps = []
    if pre_root:
        await db.members.insert_one({"_id": "S", "sponsor": "0xroot"})
        tp = {"_id": "TP0", "address": "S", "price_usd": 120.0, "status": "confirmed", "created_at": "0000"}
        await db.techpass.insert_one(tp); await d.process_techpass_income(tp)
    for i in range(1, n + 1):
        await db.members.insert_one({"_id": f"c{i}", "sponsor": "S" if pre_root else "0xroot"})
        tp = {"_id": f"TP{i}", "address": f"c{i}", "price_usd": 120.0, "status": "confirmed", "created_at": f"{i:04d}"}
        await db.techpass.insert_one(tp); tps.append(tp)
    res = await asyncio.gather(*[d.process_techpass_income(t) for t in tps], return_exceptions=True)
    errs = [repr(r) for r in res if isinstance(r, Exception)]
    nodes = await db.matrix.find({}).to_list(1000)
    over = [(x["_id"], len(x["children"])) for x in nodes if len(x["children"]) > 2]
    byid = {x["_id"]: x for x in nodes}
    orphans = [x["_id"] for x in nodes if x["parent"] and x["member"] not in byid.get(f"{x['board']}:{x['parent']}", {}).get("children", [])]
    phantom = [(x["_id"], c) for x in nodes for c in x["children"] if f"{x['board']}:{c}" not in byid]
    roots = {}
    for x in nodes:
        if x["parent"] is None:
            roots.setdefault(x["board"], []).append(x["member"])
    print(f"n={n} pre_root={pre_root} errors={errs[:3]} ({len(errs)}) overfilled={over} orphans={orphans} phantom={phantom} roots={roots}")
    print("  GM placed:", sum(1 for x in nodes if x["board"] == "GM"), " MB1 placed:", sum(1 for x in nodes if x["board"] == "MB1"))
    await db.client.drop_database(DBN)
    return not errs and not over and not orphans and not phantom


async def main():
    ok = True
    for pre in (True, False):
        for _ in range(3):
            ok &= await run(10, pre)
    print("RESULT:", "PASS" if ok else "FAIL")

asyncio.run(main())
