# Placement claim cleanup: if _place raises, placement_claims doc is removed so a retry can place the member (local DB only)
import asyncio, os, types, sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
os.environ["OWNER_ADMIN_WALLETS"] = "0xroot"
sys.path.insert(0, "/app/backend")
from income_engine import build_income_engine
DBN = "merqon_claim_cleanup"
FAILS = []


def check(name, cond, info=""):
    print(("PASS " if cond else "FAIL ") + name, info)
    if not cond:
        FAILS.append(name)


class FlakyColl:
    """Proxy around a motor collection whose insert_one raises once for a given _id."""
    def __init__(self, coll, fail_id):
        self._c, self.fail_id = coll, fail_id

    def __getattr__(self, k):
        return getattr(self._c, k)

    async def insert_one(self, doc, *a, **kw):
        if doc.get("_id") == self.fail_id:
            self.fail_id = None
            raise RuntimeError("forced insert failure")
        return await self._c.insert_one(doc, *a, **kw)


class DBProxy:
    def __init__(self, db, overrides):
        self._db, self._o = db, overrides

    def __getattr__(self, k):
        return self._o.get(k) or getattr(self._db, k)

    @property
    def client(self):
        return self._db.client


def mkd(db):
    async def gs(): return {}
    async def sw(): return {}
    async def lp(a, b): return (0.1, "admin_price", 18)
    d = types.SimpleNamespace(db=db, get_settings=gs, get_swap_config=sw, live_price=lp,
                              iso=lambda t: t.isoformat(), now_utc=lambda: datetime.now(timezone.utc))
    build_income_engine(d)
    return d


async def main():
    raw = AsyncIOMotorClient("mongodb://localhost:27017")[DBN]
    await raw.client.drop_database(DBN)
    await raw.members.insert_many([{"_id": "0xroot", "sponsor": None}, {"_id": "A", "sponsor": "0xroot"}])

    # Case 1: member doc missing -> _place raises (m is None) -> claim must be deleted
    d = mkd(raw)
    tp = {"_id": "T_X", "address": "X", "price_usd": 120.0, "status": "confirmed"}
    await raw.techpass.insert_one(dict(tp))
    err = None
    try:
        await d.process_techpass_income(tp)
    except Exception as e:
        err = e
    check("case1 placement raised", err is not None, repr(err))
    check("case1 claim removed", await raw.placement_claims.find_one({"_id": "MB1:X"}) is None)
    await raw.members.insert_one({"_id": "X", "sponsor": "0xroot"})
    await raw.techpass.update_one({"_id": "T_X"}, {"$unset": {"income_processed": 1}})
    await d.process_techpass_income(tp)
    node = await raw.matrix.find_one({"_id": "MB1:X"})
    check("case1 retry placed member", bool(node), node)
    check("case1 claim exists after success", await raw.placement_claims.find_one({"_id": "MB1:X"}) is not None)

    # Case 2: matrix.insert_one for A's node fails AFTER slot $push -> claim removed; check dangling child
    flaky = FlakyColl(raw.matrix, "MB1:A")
    d2 = mkd(DBProxy(raw, {"matrix": flaky}))
    tpa = {"_id": "T_A", "address": "A", "price_usd": 120.0, "status": "confirmed"}
    await raw.techpass.insert_one(dict(tpa))
    err = None
    try:
        await d2.process_techpass_income(tpa)
    except Exception as e:
        err = e
    check("case2 placement raised", err is not None, repr(err))
    check("case2 claim removed", await raw.placement_claims.find_one({"_id": "MB1:A"}) is None)
    root = await raw.matrix.find_one({"_id": "MB1:0xroot"})
    print("INFO case2 root children after failed insert:", root["children"])
    await raw.techpass.update_one({"_id": "T_A"}, {"$unset": {"income_processed": 1}})
    await d2.process_techpass_income(tpa)
    node = await raw.matrix.find_one({"_id": "MB1:A"})
    check("case2 retry placed member", bool(node), node)
    holders = [x["_id"] for x in await raw.matrix.find({"board": "MB1", "children": "A"}).to_list(100)]
    check("case2 A listed as child by exactly one node (its parent)", holders == [f"MB1:{node['parent']}"], holders)
    print("FAILS:", FAILS)
    await raw.client.drop_database(DBN)

asyncio.run(main())
