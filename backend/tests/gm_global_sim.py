import asyncio, os, types, sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine


async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017")["merqon_gm_test"]
    await db.client.drop_database("merqon_gm_test")
    async def gs(): return {"admin_addresses": ["0xroot"]}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    await db.members.insert_one({"_id": "0xroot", "sponsor": None})
    n = [0]
    async def join(addr, sp):
        n[0] += 1
        await db.members.insert_one({"_id": addr, "sponsor": sp})
        tp = {"_id": f"TP{n[0]}", "address": addr, "price_usd": 120.0, "status": "confirmed", "created_at": f"{n[0]:04d}"}
        await db.techpass.insert_one(tp); await d.process_techpass_income(tp)
    # two separate teams: A's team and B's team, joining interleaved
    await join("A", "0xroot"); await join("B", "0xroot")
    for i in range(1, 4):
        await join(f"a{i}", "A"); await join(f"b{i}", "B")
    gm = {x["member"]: x["parent"] for x in await db.matrix.find({"board": "GM"}).to_list(100)}
    mb = {x["member"]: x["parent"] for x in await db.matrix.find({"board": "MB1"}).to_list(100)}
    print("GM parents (global fill by order):", gm)
    print("MB1 parents (personal, under sponsor team):", mb)
    roots = [k for k, v in gm.items() if v is None]
    print("GM single root:", roots)
    await db.client.drop_database("merqon_gm_test")

asyncio.run(main())
