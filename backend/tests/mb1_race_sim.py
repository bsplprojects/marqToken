# MB1 race: concurrent process_techpass_income for many members (incl. duplicate TP docs per member) -> one MB1 node per member,
# no duplicate/overfilled children, one mb_entry per entrant, MB1 level payouts match final tree, mb_state totals consistent
import asyncio, os, types, sys, random
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine, INCOME_DEFAULTS
DBN = "merqon_mb1_race"
LEVELS = INCOME_DEFAULTS["mb_boards"][0]["levels"]


async def trial(db, n, seed, dup_tp):
    await db.client.drop_database(DBN)
    async def gs(): return {}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    rnd = random.Random(seed)
    mems = [{"_id": "0xroot", "sponsor": None}]
    for i in range(n):
        mems.append({"_id": f"m{i}", "sponsor": rnd.choice([m["_id"] for m in mems])})
    await db.members.insert_many(mems)
    tps = []
    for m in mems[1:]:
        for k in range(2 if dup_tp else 1):
            tps.append({"_id": f"T{m['_id']}_{k}", "address": m["_id"], "price_usd": 120.0, "status": "confirmed", "created_at": m["_id"]})
    await db.techpass.insert_many(tps)
    rnd.shuffle(tps)
    # also process each TP doc twice concurrently
    res = await asyncio.gather(*[d.process_techpass_income(t) for t in tps + tps], return_exceptions=True)
    problems = [repr(e) for e in res if isinstance(e, Exception)][:3]
    nodes = await db.matrix.find({"board": "MB1"}).to_list(100000)
    ids = [x["member"] for x in nodes]
    by = {x["member"]: x for x in nodes}
    if len(ids) != len(set(ids)):
        problems.append("duplicate MB1 nodes")
    allkids = [c for x in nodes for c in x["children"]]
    if len(allkids) != len(set(allkids)):
        problems.append("duplicate children")
    if any(len(x["children"]) > 2 for x in nodes):
        problems.append("overfilled")
    for x in nodes:
        for c in x["children"]:
            if c not in by or by[c]["parent"] != x["member"]:
                problems.append(f"child/parent mismatch {x['member']}->{c}")
        if x["parent"] and x["member"] not in by[x["parent"]]["children"]:
            problems.append(f"orphan {x['member']}")
    missing = [m["_id"] for m in mems[1:] if m["_id"] not in by]
    if missing:
        problems.append(f"members not placed {missing[:5]}")
    ev = await db.income_events.find({"kind": "mb_entry", "board": "MB1"}).to_list(100000)
    ents = [e["member"] for e in ev]
    if len(ents) != len(set(ents)) or len(ents) != n:
        problems.append(f"mb_entry events {len(ents)} unique {len(set(ents))} expected {n}")
    exp_total = 0.0
    for e in ev:
        depth, cur = 0, e["member"]
        while by.get(cur, {}).get("parent") and depth < len(LEVELS):
            cur = by[cur]["parent"]; depth += 1
        exp = float(sum(LEVELS[:depth]))
        exp_total += exp
        if abs(e["paid"] - exp) > 1e-6:
            problems.append(f"entry {e['member']} paid {e['paid']} expected {exp}")
    st = await db.mb_state.find({"board": 1}).to_list(100000)
    st_total = sum(s["net"] + s["saved"] for s in st)
    # MB1 money received by receivers (net + saved) must equal what entries paid out (lost update check)
    if abs(st_total - exp_total) > 1e-6:
        problems.append(f"mb_state net+saved {st_total} != paid {exp_total} (lost updates)")
    tx = await db.transactions.find({"type": "tp_momentum_booster", "meta.board": "MB1"}).to_list(100000)
    pairs = {}
    for t in tx:
        pairs.setdefault((t["address"], t["meta"]["from"]), 0)
        pairs[(t["address"], t["meta"]["from"])] += 1
    dupes = [k for k, v in pairs.items() if v > 1]
    if dupes:
        problems.append(f"duplicate MB1 payouts receiver<-from {dupes[:3]}")
    po = await db.transactions.count_documents({"type": "tp_partner_onboarding"})
    if po != len(tps):
        problems.append(f"PO tx {po} != TP docs {len(tps)}")
    return problems


async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    bad = 0
    cases = [(30, s, False) for s in range(6)] + [(25, 100 + s, True) for s in range(6)]
    for n, seed, dup in cases:
        p = await trial(db, n, seed, dup)
        print(f"n={n} seed={seed} dup_tp={dup}: {'OK' if not p else p}")
        bad += bool(p)
    print(f"MB1 RACE bad trials: {bad}/{len(cases)}")
    await db.client.drop_database(DBN)

asyncio.run(main())
