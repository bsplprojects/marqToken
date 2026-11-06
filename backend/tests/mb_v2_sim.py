import asyncio, os, types, sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine

DB = "merqon_mbv2_test"


async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DB]
    await db.client.drop_database(DB)
    rules = {"partner_onboarding_usd": 50.0}
    async def gs(): return {"admin_addresses": ["0xroot"], "income_rules": rules}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    await db.members.insert_one({"_id": "0xroot", "sponsor": None})
    await db.techpass.insert_one({"_id": "TProot", "address": "0xroot", "status": "confirmed", "price_usd": 120, "created_at": "0000", "income_processed": True})
    n = [0]
    async def join(addr, sp):
        n[0] += 1
        await db.members.insert_one({"_id": addr, "sponsor": sp})
        tp = {"_id": f"TP{n[0]}", "address": addr, "price_usd": 120.0, "status": "confirmed", "created_at": f"{n[0]:04d}"}
        await db.techpass.insert_one(tp); await d.process_techpass_income(tp)
    # root sponsors everyone directly -> root has many active directs; A has only 1 direct (flush test)
    await join("A", "0xroot"); await join("B", "0xroot")
    await join("A1", "A")  # A has 1 active direct -> A's MB payouts flushed
    for i in range(70):
        await join(f"m{i}", "0xroot")
    st = await db.mb_state.find_one({"_id": "MB1:0xroot"})
    mb2 = await db.matrix.find_one({"_id": "MB2:0xroot"})
    txs = await db.transactions.find({"address": "0xroot", "type": "tp_momentum_booster", "meta.board": "MB1"}).to_list(1000)
    print("root MB1 filled", st["filled"], "saved", round(st["saved"], 4), "upgraded", st["upgraded"], "in MB2:", bool(mb2))
    print("sample root MB1 payouts (pay, saved):", sorted({(round(t["amount"], 4), t["meta"]["saved"]) for t in txs}))
    a_tx = await db.transactions.count_documents({"address": "A", "type": "tp_momentum_booster"})
    flushed = await db.income_events.count_documents({"kind": "mb_flushed", "member": "A"})
    print("A MB txs (expect 0):", a_tx, "A flushed events:", flushed)
    gm = await db.transactions.find({"type": "tp_global_momentum"}).to_list(5)
    print("GM payouts (expect 0.9):", sorted({t["amount"] for t in gm}))
    await db.client.drop_database(DB)

asyncio.run(main())
