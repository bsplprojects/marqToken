# GM v2 + Partner Onboarding $50 simulation on a local throwaway DB (merqon_gmv2_test)
import asyncio, os, types, sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine

DBN = "merqon_gmv2_test"
fails = []


def check(name, cond, info=""):
    print(("PASS " if cond else "FAIL ") + name + (f"  [{info}]" if info else ""))
    if not cond:
        fails.append(name)


async def main(saved_rules):
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    await db.client.drop_database(DBN)
    async def gs(): return {"admin_addresses": ["0xroot"], "income_rules": saved_rules}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    await db.members.insert_one({"_id": "0xroot", "sponsor": None})
    n = [0]

    async def reg(addr, sp):
        await db.members.insert_one({"_id": addr, "sponsor": sp})

    async def buy(addr):
        n[0] += 1
        tp = {"_id": f"TP{n[0]}", "address": addr, "price_usd": 120.0, "status": "confirmed", "created_at": f"{n[0]:04d}"}
        await db.techpass.insert_one(tp)
        await d.process_techpass_income(tp)

    async def inc(addr, k):
        m = await db.members.find_one({"_id": addr}) or {}
        return round((m.get("income_usd") or {}).get(k, 0.0), 4)

    async def gm():
        return {x["member"]: x["parent"] for x in await db.matrix.find({"board": "GM"}).to_list(1000)}

    r = await d.income_rules()
    check("rules partner_onboarding_usd == 50", r["partner_onboarding_usd"] == 50, r["partner_onboarding_usd"])
    check("rules no partner_onboarding_pct", "partner_onboarding_pct" not in r)

    # Team A: A sponsored by root; A has 3 directs a1..a3 (MB1 spill a3 under a1)
    await reg("A", "0xroot"); await buy("A")
    check("A not in GM w/0 directs", "A" not in await gm())
    check("no GM paid to root after A buy", await inc("0xroot", "tp_global_momentum") == 0)
    await reg("a1", "A"); await buy("a1")
    check("A not in GM after 1 active direct", "A" not in await gm())
    await reg("a2", "A")  # registered but not active
    check("A not in GM, a2 inactive", "A" not in await gm())
    await buy("a2")  # 2nd active direct triggers A entry
    g = await gm()
    check("A enters GM on 2nd direct TP", "A" in g, g)
    check("A placed under root", g.get("A") == "0xroot")
    check("root got $1 GM for A", await inc("0xroot", "tp_global_momentum") == 1.0)
    await reg("a3", "A"); await buy("a3")
    # spill check: a3 MB1 parent should be a1 or a2 (A has 2 kids already)
    mb = {x["member"]: x["parent"] for x in await db.matrix.find({"board": "MB1"}).to_list(100)}
    check("a3 spilled in MB1 under a1/a2", mb.get("a3") in ("a1", "a2"), mb.get("a3"))
    check("Sponsor A gets exactly $150 PO for 3 directs (spill incl.)", await inc("A", "tp_partner_onboarding") == 150.0,
          await inc("A", "tp_partner_onboarding"))
    spill_parent = mb.get("a3")
    check("MB placement parent got NO PO for spilled a3", await inc(spill_parent, "tp_partner_onboarding") == 0.0)
    check("root PO = $50 (A only)", await inc("0xroot", "tp_partner_onboarding") == 50.0)

    # Team B interleaved: B under root, B's directs; and deep chain
    await reg("B", "0xroot"); await buy("B")
    check("root not double-entered", list((await gm()).values()).count(None) == 1)
    await reg("b1", "B"); await buy("b1")
    await reg("b2", "B"); await buy("b2")
    g = await gm()
    check("B enters GM, under root (global BFS slot 2)", g.get("B") == "0xroot", g)
    check("root GM = $2", await inc("0xroot", "tp_global_momentum") == 2.0)
    # a1 qualifies (team A) -> global level 2 first slot (under A)
    await reg("x1", "a1"); await buy("x1"); await reg("x2", "a1"); await buy("x2")
    g = await gm()
    check("a1 placed under A (BFS level 2 first)", g.get("a1") == "A", g)
    check("A got $1 GM from a1", await inc("A", "tp_global_momentum") == 1.0)
    # b1 qualifies (team B) -> should go under A too (A has 1 child slot left) — global, not team
    await reg("y1", "b1"); await buy("y1"); await reg("y2", "b1"); await buy("y2")
    g = await gm()
    check("b1 (team B) placed under A (global ordering, not team)", g.get("b1") == "A", g)
    check("root GM = $4 (A,B,a1,b1)", await inc("0xroot", "tp_global_momentum") == 4.0)
    # own TP trigger: c has 2 active directs before buying
    await reg("c", "B"); await reg("c1", "c"); await reg("c2", "c"); await buy("c1"); await buy("c2")
    check("c not in GM without own TP", "c" not in await gm())
    await buy("c")
    g = await gm()
    check("c enters GM on own TP (has 2 active directs)", "c" in g and g["c"] == "B", g.get("c"))
    # GM payout: c's ancestors B, root -> each $1
    check("B got $1 GM from c", await inc("B", "tp_global_momentum") == 1.0)
    # gm members without 2 directs not in GM
    for x in ["a2", "a3", "b2", "x1", "y1", "c1"]:
        check(f"{x} (<2 directs) not in GM", x not in g)
    tx = await db.transactions.count_documents({"type": "tp_global_momentum"})
    ev = await db.income_events.find({"kind": "gm_entry"}).to_list(100)
    check("GM tx count == sum paid_levels", tx == sum(e["paid_levels"] for e in ev), (tx, [e["paid_levels"] for e in ev]))
    # 20 level cap: chain of 22 GM members deep -> deepest pays only 20
    # Idempotency: reprocess same TP
    tp1 = await db.techpass.find_one({"_id": "TP1"})
    before = await inc("0xroot", "tp_partner_onboarding")
    await d.process_techpass_income(tp1)
    check("reprocess TP idempotent", await inc("0xroot", "tp_partner_onboarding") == before)
    await db.client.drop_database(DBN)


async def level_cap():
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    await db.client.drop_database(DBN)
    async def gs(): return {"income_rules": {"gm_levels": 3}}
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
    # create 60 GM-qualified members: each Qi has 2 directs
    for i in range(60):
        await join(f"Q{i}", "0xroot"); await join(f"Q{i}d1", f"Q{i}"); await join(f"Q{i}d2", f"Q{i}")
    ev = await db.income_events.find({"kind": "gm_entry"}).to_list(100)
    check("60 GM entries", len(ev) == 60, len(ev))
    check("gm_levels=3 cap respected", max(e["paid_levels"] for e in ev) == 3, max(e["paid_levels"] for e in ev))
    nodes = await db.matrix.find({"board": "GM"}).to_list(1000)
    check("no GM node > 2 children", all(len(x["children"]) <= 2 for x in nodes))
    # BFS: Q0,Q1 under root; Q2,Q3 under Q0
    g = {x["member"]: x["parent"] for x in nodes}
    check("BFS ordering", g["Q0"] == "0xroot" and g["Q1"] == "0xroot" and g["Q2"] == "Q0" and g["Q3"] == "Q0" and g["Q4"] == "Q1", g)
    await db.client.drop_database(DBN)


print("=== default rules ===")
asyncio.run(main({}))
print("=== legacy saved partner_onboarding_pct=50 ===")
asyncio.run(main({"partner_onboarding_pct": 50}))
print("=== level cap / bfs ===")
asyncio.run(level_cap())
print("FAILS:", fails)
