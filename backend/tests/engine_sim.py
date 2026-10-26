import asyncio, os, types
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
import sys; sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine

async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017")["merqon_engine_test"]
    await db.client.drop_database("merqon_engine_test")
    async def gs(): return {"admin_addresses": ["0xroot"]}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    await db.members.insert_one({"_id": "0xroot", "sponsor": None})
    # root sponsors A; A sponsors 62 people (fills A's MB1 5 levels exactly via spillover)
    async def join(addr, sp, i):
        await db.members.insert_one({"_id": addr, "sponsor": sp})
        tp = {"_id": f"TP{i}", "address": addr, "price_usd": 120.0, "status": "confirmed", "created_at": str(i)}
        await db.techpass.insert_one(tp); await d.process_techpass_income(tp)
    await join("A", "0xroot", 0)
    for i in range(1, 63):
        await join(f"m{i}", "A", i)
    A = await db.members.find_one({"_id": "A"})
    usd = A.get("income_usd", {})
    print("A partner onboarding USD:", usd.get("tp_partner_onboarding"), "(expect 62*60=3720)")
    print("A MB USD paid:", usd.get("tp_momentum_booster"), "(expect 400 net, 300 saved)")
    print("A GM USD:", usd.get("tp_global_momentum"))
    st = await db.mb_state.find_one({"_id": "MB1:A"}); print("A MB1 state:", {k: st[k] for k in ("net", "saved", "upgraded")})
    print("A in MB2:", bool(await db.matrix.find_one({"_id": "MB2:A"})))
    a_node = await db.matrix.find_one({"_id": "MB1:A"}); print("A MB1 children:", a_node["children"], "parent:", a_node["parent"])
    print("GM skipped events:", await db.income_events.count_documents({"kind": "gm_skipped"}))
    # idempotency
    await d.process_techpass_income(await db.techpass.find_one({"_id": "TP5"}))
    print("txs after re-run same:", await db.transactions.count_documents({"meta.from": "m5", "type": "tp_partner_onboarding"}))
    mb = await d.member_mb("A"); print("member_mb MB1/MB2:", mb[0]["net"], mb[0]["saved"], mb[1]["joined"])
    await db.client.drop_database("merqon_engine_test")

asyncio.run(main())
