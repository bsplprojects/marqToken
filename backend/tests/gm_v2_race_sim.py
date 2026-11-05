# Race: member's own TechPass and 2nd direct's TechPass confirmed concurrently -> GM entry must happen once
import asyncio, os, types, sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine
DBN = "merqon_gmv2_race"


async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    bad = 0
    for trial in range(15):
        await db.client.drop_database(DBN)
        async def gs(): return {}
        async def sw(): return {}
        async def lp(a, b): return (0.1, "admin_price", 18)
        d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                                  iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
        build_income_engine(d)
        await db.members.insert_many([{"_id": "0xroot", "sponsor": None}, {"_id": "A", "sponsor": "0xroot"},
                                      {"_id": "a1", "sponsor": "A"}, {"_id": "a2", "sponsor": "A"}])
        tps = [{"_id": f"T{x}", "address": x, "price_usd": 120.0, "status": "confirmed", "created_at": x} for x in ("A", "a1", "a2")]
        await db.techpass.insert_many(tps)
        res = await asyncio.gather(*[d.process_techpass_income(t) for t in tps], return_exceptions=True)
        errs = [repr(e) for e in res if isinstance(e, Exception)]
        root = await db.matrix.find_one({"_id": "GM:0xroot"})
        gmtx = await db.transactions.count_documents({"type": "tp_global_momentum"})
        ok = (root and root["children"].count("A") <= 1 and gmtx <= 1 and not errs)
        if not ok:
            bad += 1
            print("trial", trial, "root children", root and root["children"], "gm tx", gmtx, "errs", errs[:1])
    print(f"RACE bad trials: {bad}/15")
    await db.client.drop_database(DBN)

asyncio.run(main())
