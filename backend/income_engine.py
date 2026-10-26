"""Merq TechPass income engine: Partner Onboarding, Momentum Booster (MB1-MB8), Global Momentum."""
from collections import deque
import os
import secrets


def _mb(levels, net, save):
    return {"levels": levels, "net_profit": net, "upgrade_save": save}


INCOME_DEFAULTS = {
    "partner_onboarding_pct": 50.0,
    "gm_levels": 20, "gm_amount_per_level": 1.0, "gm_min_directs": 2,
    "mb_boards": [
        _mb([50, 10, 10, 10, 10], 400, 300),
        _mb([50] * 5, 2000, 1100),
        _mb([200] * 5, 8000, 4400),
        _mb([800] * 5, 30000, 19600),
        _mb([3200] * 5, 120000, 78400),
        _mb([12800] * 5, 480000, 313600),
        _mb([51200] * 5, 1920000, 1254400),
        _mb([204800] * 5, 12697600, 0),
    ],
}


def build_income_engine(d):
    db = d.db

    async def rules():
        s = await d.get_settings()
        return {**INCOME_DEFAULTS, **(s.get("income_rules") or {})}

    async def owner_root():
        owners = [a.strip().lower() for a in os.environ.get("OWNER_ADMIN_WALLETS", "").split(",") if a.strip()]
        return owners[0] if owners else None

    async def place(board: str, addr: str):
        """Place addr in board tree under nearest sponsor-upline already in that board (BFS spillover)."""
        pid = f"{board}:{addr}"
        if await db.matrix.find_one({"_id": pid}):
            return None
        m = await db.members.find_one({"_id": addr})
        up, anchor = m.get("sponsor"), None
        seen = set()
        while up and up not in seen:
            seen.add(up)
            if await db.matrix.find_one({"_id": f"{board}:{up}"}):
                anchor = up
                break
            up = (await db.members.find_one({"_id": up}, {"sponsor": 1}) or {}).get("sponsor")
        if anchor is None:
            root = await owner_root()
            if root and root != addr:
                if not await db.matrix.find_one({"_id": f"{board}:{root}"}):
                    await db.matrix.insert_one({"_id": f"{board}:{root}", "board": board, "member": root,
                                                "parent": None, "children": [], "created_at": d.iso(d.now_utc())})
                anchor = root
        parent = None
        if anchor:
            q = deque([anchor])
            while q:
                cur = q.popleft()
                node = await db.matrix.find_one({"_id": f"{board}:{cur}"})
                if len(node["children"]) < 2:
                    parent = cur
                    break
                q.extend(node["children"])
        await db.matrix.insert_one({"_id": pid, "board": board, "member": addr, "parent": parent, "children": [],
                                    "created_at": d.iso(d.now_utc())})
        if parent:
            await db.matrix.update_one({"_id": f"{board}:{parent}"}, {"$push": {"children": addr}})
        return parent

    async def ancestors(board: str, addr: str, depth: int):
        out, cur = [], addr
        for _ in range(depth):
            node = await db.matrix.find_one({"_id": f"{board}:{cur}"}, {"parent": 1})
            if not node or not node.get("parent"):
                break
            cur = node["parent"]
            out.append(cur)
        return out

    async def credit(addr, key, usd, meta, price):
        merq = round(usd / price, 6) if price > 0 else 0.0
        await db.members.update_one({"_id": addr}, {"$inc": {"available": merq, f"income.{key}": merq,
                                                             f"income_usd.{key}": usd}})
        await db.transactions.insert_one({"_id": secrets.token_hex(12), "address": addr, "type": key, "amount": merq,
                                          "status": "confirmed", "tx_hash": None, "created_at": d.iso(d.now_utc()),
                                          "meta": {**meta, "usd": usd, "merq_price": price}})

    async def log(kind, **kw):
        await db.income_events.insert_one({"_id": secrets.token_hex(12), "kind": kind, **kw, "created_at": d.iso(d.now_utc())})

    async def mb_receive(addr, b, usd, source, r, price, depth=0):
        """Receiver gets usd from board b: net first, then save for next board; auto-upgrade when saved."""
        boards = r["mb_boards"]
        sid = f"MB{b + 1}:{addr}"
        st = await db.mb_state.find_one({"_id": sid}) or {"_id": sid, "member": addr, "board": b + 1, "net": 0.0,
                                                               "saved": 0.0, "upgraded": False}
        cfg = boards[b]
        has_next = b + 1 < len(boards) and cfg["upgrade_save"] > 0
        if st["upgraded"] or not has_next:
            pay, save = usd, 0.0
        else:
            pay = min(usd, max(0.0, cfg["net_profit"] - st["net"]))
            save = min(usd - pay, max(0.0, cfg["upgrade_save"] - st["saved"]))
            pay += usd - pay - save
        st["net"] += pay
        st["saved"] += save
        if pay > 0:
            await credit(addr, "tp_momentum_booster", round(pay, 4), {"board": f"MB{b + 1}", "from": source}, price)
        ready = not st["upgraded"] and has_next and st["saved"] >= cfg["upgrade_save"] - 1e-9
        if ready:
            st["upgraded"] = True
        await db.mb_state.replace_one({"_id": sid}, st, upsert=True)
        if ready and depth < 10:
            await mb_enter(addr, b + 1, r, price, funded=st["saved"], depth=depth + 1)

    async def mb_enter(addr, b, r, price, funded=None, depth=0):
        board = f"MB{b + 1}"
        if await db.matrix.find_one({"_id": f"{board}:{addr}"}):
            return
        await place(board, addr)
        levels = r["mb_boards"][b]["levels"]
        ups = await ancestors(board, addr, len(levels))
        paid = 0.0
        for i, amt in enumerate(levels):
            if i < len(ups):
                await mb_receive(ups[i], b, float(amt), addr, r, price, depth)
                paid += amt
        lp = (funded - sum(levels)) if funded is not None else 0.0
        await log("mb_entry", member=addr, board=board, paid=paid, unassigned=sum(levels) - paid, lp_treasury=max(lp, 0.0))

    async def process_techpass(tp: dict):
        """Run once per confirmed TechPass."""
        claimed = await db.techpass.find_one_and_update({"_id": tp["_id"], "status": "confirmed", "income_processed": {"$ne": True}},
                                                        {"$set": {"income_processed": True}})
        if not claimed:
            return
        r = await rules()
        swap, settings = await d.get_swap_config(), await d.get_settings()
        price, _, _ = await d.live_price(swap, settings)
        addr, usd = tp["address"], float(tp["price_usd"])
        m = await db.members.find_one({"_id": addr})
        sp = m.get("sponsor")
        if sp:
            await credit(sp, "tp_partner_onboarding", round(usd * r["partner_onboarding_pct"] / 100, 4), {"from": addr}, price)
        await mb_enter(addr, 0, r, price)
        await place("GM", addr)
        gm_ups = await ancestors("GM", addr, int(r["gm_levels"]))
        for lvl, up in enumerate(gm_ups, start=1):
            directs = await db.members.find({"sponsor": up}, {"_id": 1}).to_list(10000)
            n = await db.techpass.count_documents({"address": {"$in": [x["_id"] for x in directs]}, "status": "confirmed"})
            if n >= int(r["gm_min_directs"]):
                await credit(up, "tp_global_momentum", float(r["gm_amount_per_level"]), {"from": addr, "level": lvl}, price)
            else:
                await log("gm_skipped", member=up, level=lvl, source=addr, usd=float(r["gm_amount_per_level"]))
        await log("techpass_processed", member=addr, techpass=tp["_id"])

    async def member_mb(addr):
        r = await rules()
        out = []
        for i, cfg in enumerate(r["mb_boards"]):
            pos = await db.matrix.find_one({"_id": f"MB{i + 1}:{addr}"})
            st = await db.mb_state.find_one({"_id": f"MB{i + 1}:{addr}"}) or {}
            out.append({"board": f"MB{i + 1}", "joined": bool(pos), "team": len(pos["children"]) if pos else 0,
                        "net": round(st.get("net", 0.0), 2), "net_cap": cfg["net_profit"],
                        "saved": round(st.get("saved", 0.0), 2), "save_target": cfg["upgrade_save"],
                        "upgraded": st.get("upgraded", False), "levels": cfg["levels"]})
        return out

    async def matrix_tree(board: str, me: str, root: str, depth: int = 4):
        """Subtree of `root` (must be me or inside my subtree) in board, `depth` levels below root."""
        cur, ok = root, root == me
        for _ in range(40):
            if ok:
                break
            node = await db.matrix.find_one({"_id": f"{board}:{cur}"}, {"parent": 1})
            if not node or not node.get("parent"):
                break
            cur = node["parent"]
            ok = cur == me
        if not ok:
            root = me

        async def build(addr, lvl):
            node = await db.matrix.find_one({"_id": f"{board}:{addr}"})
            if not node:
                return None
            m = await db.members.find_one({"_id": addr}, {"address": 1, "sponsor": 1})
            kids = [await build(c, lvl + 1) for c in node["children"]] if lvl < depth else []
            return {"address": m["address"] if m else addr, "short": f"{addr[:6]}…{addr[-4:]}", "level": lvl,
                    "direct": bool(m and m.get("sponsor") == me), "joined_at": node["created_at"],
                    "has_more": lvl >= depth and bool(node["children"]), "children": [k for k in kids if k]}

        tree = await build(root, 0)
        count = await db.matrix.count_documents({"board": board})
        return {"board": board, "root": root, "is_self": root == me, "joined": tree is not None,
                "tree": tree, "board_members": count, "depth": depth}

    async def backfill():
        for tp in await db.techpass.find({"status": "confirmed", "income_processed": {"$ne": True}}).sort("created_at", 1).to_list(100000):
            await process_techpass(tp)

    d.income_rules = rules
    d.matrix_tree = matrix_tree
    d.income_backfill = backfill
    d.process_techpass_income = process_techpass
    d.member_mb = member_mb
    d.INCOME_DEFAULTS = INCOME_DEFAULTS
