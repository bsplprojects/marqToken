import asyncio, os, types, sys
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
sys.path.insert(0, "/app/backend")
from port_income import build_port_income

NOW = [datetime.now(timezone.utc)]


async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017")["merqon_port_test"]
    await db.client.drop_database("merqon_port_test")
    async def gs(): return (await db.settings.find_one({"_id": "global"})) or {}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp, current_member=lambda: None,
                              iso=lambda t: t.isoformat(), now_utc=lambda: NOW[0], parse_iso=datetime.fromisoformat)
    await db.settings.insert_one({"_id": "global"})
    build_port_income(d)
    n = [0]

    async def buy(addr, port, usd, sp=None):
        if not await db.members.find_one({"_id": addr}):
            await db.members.insert_one({"_id": addr, "sponsor": sp})
        n[0] += 1
        p = {"_id": f"P{n[0]}", "address": addr, "port": port, "amount_usd": usd, "status": "confirmed",
             "created_at": NOW[0].isoformat(), "verified_at": NOW[0].isoformat()}
        await db.port_purchases.insert_one(p)
        await d.process_port_income(p)

    usd = lambda m: m.get("income_usd", {})
    await db.members.insert_one({"_id": "root", "sponsor": None})
    await buy("S", "entry", 100, "root")          # S self-invest 100 -> levels unlocked
    await buy("U", "unity", 1000, "S")            # S gets 5% = 50
    await buy("E", "entry", 500, "S")             # entry: no sponsor reward
    S = await db.members.find_one({"_id": "S"})
    print("S onboarding:", usd(S).get("port_partner_onboarding_rewards"), "(expect 50)")
    U = await db.port_purchases.find_one({"_id": "P2"})
    print("U daily pct:", U["daily_pct"], "(0.75) lock:", U["lock_until"][:10])
    NOW[0] += timedelta(days=2, hours=1)
    await d.port_accrue(); await d.port_accrue()  # idempotent
    U_m = await db.members.find_one({"_id": "U"}); S = await db.members.find_one({"_id": "S"})
    print("U daily:", usd(U_m).get("port_daily_earnings"), "(expect 15)")
    print("S level income:", usd(S).get("port_level_income"), "(expect 25% of (15+3)=4.5)")
    print("root level skipped events:", await db.income_events.count_documents({"kind": "level_skipped", "member": "root"}))
    try:
        await d.port_withdraw_principal("U", "P2"); print("UNEXPECTED unity withdraw")
    except Exception as e:
        print("unity locked ok:", e.detail)
    r = await d.port_withdraw_principal("E", "P3"); print("entry principal returned merq:", r["merq"], "(5000)")
    # ranks: root with two legs of 10k each -> M1 one-time 150
    await buy("L1", "entry", 10000, "root")
    await buy("L2", "unity", 10000, "root")
    root = await db.members.find_one({"_id": "root"})
    print("root rank:", root.get("port_rank"), "reward:", usd(root).get("port_rank_rewards"), "(expect 1, 150 since S leg=10600? )")
    await buy("L2b", "entry", 100, "L2")
    root = await db.members.find_one({"_id": "root"})
    print("root rank stays:", root.get("port_rank"), "reward:", usd(root).get("port_rank_rewards"))
    print("celebrations:", await db.celebrations.count_documents({"member": "root"}))
    info = await d.port_member_info("root"); print("info:", info["rank"], info["legs"], info["next_rank"]["name"])
    await db.client.drop_database("merqon_port_test")

asyncio.run(main())
