"""Entry/Unity Port incomes: daily earnings, Partner Onboarding (Unity), Level Income, Rank Rewards."""
import asyncio
import hmac
import os
import secrets
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends, Request

PORT_INCOME_DEFAULTS = {
    "entry_daily_pct": 0.30,
    "unity_tiers": [{"min_usd": 0, "daily_pct": 0.50}, {"min_usd": 1000, "daily_pct": 0.75}, {"min_usd": 5000, "daily_pct": 1.00}],
    "unity_lock_days": 365,
    "sponsor_pct": 5.0,
    "level_pcts": [25, 15, 10, 5, 4, 3, 2, 1],
    "level_min_self_usd": 100.0,
    "ranks": [
        {"name": "M1", "leg_usd": 10000, "need_rank": 0, "need_count": 0, "pct": 1.5},
        {"name": "M2", "leg_usd": 50000, "need_rank": 1, "need_count": 1, "pct": 2},
        {"name": "M3", "leg_usd": 150000, "need_rank": 1, "need_count": 2, "pct": 4},
        {"name": "M4", "leg_usd": 300000, "need_rank": 2, "need_count": 1, "pct": 6},
        {"name": "M5", "leg_usd": 500000, "need_rank": 2, "need_count": 2, "pct": 6},
        {"name": "M6", "leg_usd": 1000000, "need_rank": 3, "need_count": 1, "pct": 12},
        {"name": "M7", "leg_usd": 5000000, "need_rank": 3, "need_count": 2, "pct": 20},
    ],
}
PORT_STREAMS = ["port_daily_earnings", "port_partner_onboarding_rewards", "port_level_income", "port_rank_rewards"]


def daily_pct(r, port, usd):
    if port == "entry":
        return float(r["entry_daily_pct"])
    pct = 0.0
    for t in sorted(r["unity_tiers"], key=lambda t: t["min_usd"]):
        if usd >= t["min_usd"]:
            pct = float(t["daily_pct"])
    return pct


def build_port_income(d):
    db = d.db

    async def rules():
        s = await d.get_settings()
        return {**PORT_INCOME_DEFAULTS, **(s.get("port_income_rules") or {})}

    async def price():
        p, _, _ = await d.live_price(await d.get_swap_config(), await d.get_settings())
        return p

    async def credit(addr, key, usd, meta, px):
        merq = round(usd / px, 6) if px > 0 else 0.0
        await db.members.update_one({"_id": addr}, {"$inc": {"available": merq, f"income.{key}": merq, f"income_usd.{key}": usd}})
        await db.transactions.insert_one({"_id": secrets.token_hex(12), "address": addr, "type": key, "amount": merq,
                                          "status": "confirmed", "tx_hash": None, "created_at": d.iso(d.now_utc()),
                                          "meta": {**meta, "usd": usd, "merq_price": px}})

    async def self_invest(addr):
        agg = await db.port_purchases.aggregate([{"$match": {"address": addr, "status": "confirmed", "principal_status": {"$ne": "withdrawn"}}},
                                                 {"$group": {"_id": None, "usd": {"$sum": "$amount_usd"}}}]).to_list(1)
        return agg[0]["usd"] if agg else 0.0

    async def uplines(addr, n):
        out, cur, seen = [], addr, {addr}
        for _ in range(n):
            m = await db.members.find_one({"_id": cur}, {"sponsor": 1})
            cur = (m or {}).get("sponsor")
            if not cur or cur in seen:
                break
            seen.add(cur)
            out.append(cur)
        return out

    async def team(addr):
        """Business per direct leg (whole sub-team incl. the direct) + downline members' ranks."""
        biz = {x["_id"]: x["usd"] for x in await db.port_purchases.aggregate(
            [{"$match": {"status": "confirmed"}}, {"$group": {"_id": "$address", "usd": {"$sum": "$amount_usd"}}}]).to_list(100000)}
        legs, ranks = [], []
        for c in await db.members.find({"sponsor": addr}, {"_id": 1}).to_list(10000):
            total, q, seen = 0.0, [c["_id"]], set()
            while q:
                cur = q.pop()
                if cur in seen:
                    continue
                seen.add(cur)
                total += biz.get(cur, 0.0)
                for k in await db.members.find({"sponsor": cur}, {"_id": 1, "port_rank": 1}).to_list(10000):
                    q.append(k["_id"])
            legs.append({"leg": c["_id"], "usd": round(total, 2)})
            ranks += [x.get("port_rank", 0) for x in await db.members.find({"_id": {"$in": list(seen)}}, {"port_rank": 1}).to_list(100000)]
        legs.sort(key=lambda x: -x["usd"])
        return legs, ranks

    def qualifies(rk, legs, ranks):
        top = [x["usd"] for x in legs[:2]] + [0, 0]
        return top[0] >= rk["leg_usd"] and top[1] >= rk["leg_usd"] and \
            sum(1 for x in ranks if x >= rk["need_rank"]) >= rk["need_count"]

    async def check_rank(addr, r, px):
        m = await db.members.find_one({"_id": addr}, {"port_rank": 1})
        if not m:
            return
        cur = m.get("port_rank", 0)
        legs, ranks = await team(addr)
        while cur < len(r["ranks"]) and qualifies(r["ranks"][cur], legs, ranks):
            rk = r["ranks"][cur]
            res = await db.members.update_one({"_id": addr, "port_rank": {"$in": [cur] + ([None] if cur == 0 else [])}},
                                              {"$set": {"port_rank": cur + 1}})
            if not res.modified_count:
                return
            cur += 1
            usd = round(rk["leg_usd"] * rk["pct"] / 100, 4)
            await credit(addr, "port_rank_rewards", usd, {"rank": rk["name"], "leg_usd": rk["leg_usd"], "pct": rk["pct"]}, px)
            await db.rank_awards.insert_one({"_id": secrets.token_hex(12), "member": addr, "rank": rk["name"], "usd": usd,
                                             "legs": legs[:2], "created_at": d.iso(d.now_utc())})
            await db.celebrations.insert_one({"_id": secrets.token_hex(12), "member": addr, "kind": "rank",
                                              "title": rk["name"], "usd": usd, "seen": False, "created_at": d.iso(d.now_utc())})

    async def process_purchase(p):
        claimed = await db.port_purchases.find_one_and_update(
            {"_id": p["_id"], "status": "confirmed", "income_processed": {"$ne": True}},
            {"$set": {"income_processed": True, "principal_status": "active", "accrued_days": 0, "earned_usd": 0.0}})
        if not claimed:
            return
        r, px = await rules(), await price()
        start = d.parse_iso(claimed.get("verified_at") or claimed["created_at"])
        upd = {"daily_pct": daily_pct(r, claimed["port"], claimed["amount_usd"]), "accrual_start": d.iso(start)}
        if claimed["port"] == "unity":
            upd["lock_until"] = d.iso(start + timedelta(days=int(r["unity_lock_days"])))
            sp = (await db.members.find_one({"_id": claimed["address"]}, {"sponsor": 1}) or {}).get("sponsor")
            if sp:
                await credit(sp, "port_partner_onboarding_rewards", round(claimed["amount_usd"] * r["sponsor_pct"] / 100, 4),
                             {"from": claimed["address"], "purchase": claimed["_id"]}, px)
        await db.port_purchases.update_one({"_id": claimed["_id"]}, {"$set": upd})
        for up in await uplines(claimed["address"], 200):
            await check_rank(up, r, px)

    async def accrue():
        r, px = await rules(), await price()
        now, credited = d.now_utc(), 0
        for p in await db.port_purchases.find({"status": "confirmed", "income_processed": True,
                                               "principal_status": "active"}).to_list(100000):
            days = int((now - d.parse_iso(p["accrual_start"])).total_seconds() // 86400)
            new = days - p.get("accrued_days", 0)
            if new <= 0:
                continue
            roi = round(p["amount_usd"] * p["daily_pct"] / 100 * new, 6)
            res = await db.port_purchases.update_one({"_id": p["_id"], "accrued_days": p.get("accrued_days", 0), "principal_status": "active"},
                                                     {"$set": {"accrued_days": days}, "$inc": {"earned_usd": roi}})
            if not res.modified_count:
                continue
            credited += 1
            await credit(p["address"], "port_daily_earnings", roi, {"purchase": p["_id"], "port": p["port"], "days": new}, px)
            for lvl, up in enumerate(await uplines(p["address"], len(r["level_pcts"])), start=1):
                if await self_invest(up) >= r["level_min_self_usd"]:
                    await credit(up, "port_level_income", round(roi * r["level_pcts"][lvl - 1] / 100, 6),
                                 {"from": p["address"], "level": lvl, "purchase": p["_id"]}, px)
                else:
                    await db.income_events.insert_one({"_id": secrets.token_hex(12), "kind": "level_skipped", "member": up, "level": lvl,
                                                       "usd": round(roi * r["level_pcts"][lvl - 1] / 100, 6), "created_at": d.iso(now)})
        await db.settings.update_one({"_id": "global"}, {"$set": {"port_last_accrual": d.iso(now)}})
        return credited

    async def withdraw_principal(addr, pid):
        p = await db.port_purchases.find_one({"_id": pid, "address": addr, "status": "confirmed"})
        if not p or p.get("principal_status") != "active":
            raise HTTPException(404, "Active purchase not found")
        if p.get("lock_until") and d.parse_iso(p["lock_until"]) > d.now_utc():
            raise HTTPException(400, f"Unity Port principal is locked until {p['lock_until'][:10]}")
        await accrue()
        res = await db.port_purchases.update_one({"_id": pid, "principal_status": "active"},
                                                 {"$set": {"principal_status": "withdrawn", "principal_withdrawn_at": d.iso(d.now_utc())}})
        if not res.modified_count:
            raise HTTPException(409, "Principal already withdrawn")
        px = await price()
        merq = round(p["amount_usd"] / px, 6) if px > 0 else 0.0
        await db.members.update_one({"_id": addr}, {"$inc": {"available": merq}})
        await db.transactions.insert_one({"_id": secrets.token_hex(12), "address": addr, "type": "port_principal_return", "amount": merq,
                                          "status": "confirmed", "tx_hash": None, "created_at": d.iso(d.now_utc()),
                                          "meta": {"purchase": pid, "usd": p["amount_usd"], "merq_price": px}})
        return {"ok": True, "merq": merq, "usd": p["amount_usd"]}

    async def member_info(addr):
        r = await rules()
        m = await db.members.find_one({"_id": addr}, {"port_rank": 1})
        rank = (m or {}).get("port_rank", 0)
        legs, ranks = await team(addr)
        nxt = r["ranks"][rank] if rank < len(r["ranks"]) else None
        mine = await self_invest(addr)
        return {"rank": r["ranks"][rank - 1]["name"] if rank else None, "rank_index": rank, "legs": legs[:2],
                "next_rank": nxt and {**nxt, "need_rank_name": r["ranks"][nxt["need_rank"] - 1]["name"] if nxt["need_rank"] else None,
                                      "have_count": sum(1 for x in ranks if x >= nxt["need_rank"]) if nxt["need_rank"] else 0},
                "self_invest_usd": round(mine, 2), "levels_unlocked": mine >= r["level_min_self_usd"],
                "level_min_self_usd": r["level_min_self_usd"], "level_pcts": r["level_pcts"], "ranks": r["ranks"],
                "entry_daily_pct": r["entry_daily_pct"], "unity_tiers": r["unity_tiers"], "unity_lock_days": r["unity_lock_days"],
                "sponsor_pct": r["sponsor_pct"]}

    async def backfill():
        for p in await db.port_purchases.find({"status": "confirmed", "income_processed": {"$ne": True}}).sort("created_at", 1).to_list(100000):
            await process_purchase(p)

    r_ = APIRouter(prefix="/api")

    @r_.post("/cron/port-accrual")
    async def cron_accrual(request: Request):
        # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
        secret = os.environ.get("WEBHOOK_CRON_SECRET", "")
        auth = request.headers.get("authorization", "")
        if not secret or not auth.startswith("Bearer ") or not hmac.compare_digest(auth[7:], secret):
            raise HTTPException(401, "Unauthorized")
        run_id = request.headers.get("x-webhook-id") or secrets.token_hex(8)
        if await db.cron_runs.find_one({"_id": run_id}):
            return {"ok": True, "duplicate": True}
        await db.cron_runs.insert_one({"_id": run_id, "job": "port-accrual", "created_at": d.iso(d.now_utc())})
        asyncio.create_task(accrue())
        return {"ok": True, "accepted": run_id}

    @r_.post("/ports/principal/{pid}/withdraw")
    async def principal(pid: str, m: dict = Depends(d.current_member)):
        return await withdraw_principal(m["_id"], pid)

    @r_.get("/income/port-info")
    async def port_info(m: dict = Depends(d.current_member)):
        return await member_info(m["_id"])

    @r_.get("/income/celebrations")
    async def celebrations(m: dict = Depends(d.current_member)):
        docs = await db.celebrations.find({"member": m["_id"], "seen": False}).sort("created_at", 1).to_list(20)
        return [{"id": c["_id"], "kind": c["kind"], "title": c["title"], "from_board": c.get("from_board"),
                 "usd": c.get("usd"), "created_at": c["created_at"]} for c in docs]

    @r_.post("/income/celebrations/{cid}/seen")
    async def seen(cid: str, m: dict = Depends(d.current_member)):
        await db.celebrations.update_one({"_id": cid, "member": m["_id"]}, {"$set": {"seen": True}})
        return {"ok": True}

    d.port_income_rules = rules
    d.process_port_income = process_purchase
    d.port_accrue = accrue
    d.port_withdraw_principal = withdraw_principal
    d.port_member_info = member_info
    d.port_income_backfill = backfill
    d.PORT_INCOME_DEFAULTS = PORT_INCOME_DEFAULTS
    d.PORT_STREAMS = PORT_STREAMS
    return r_
