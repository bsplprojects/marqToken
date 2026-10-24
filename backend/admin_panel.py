"""MerqON Admin Panel — RBAC-gated comprehensive admin API (separate shell)."""
import io
import csv
import time
import secrets
from datetime import timedelta

import requests
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

# ----------------------------- RBAC -----------------------------
MODULES = [
    "dashboard", "members", "mlm", "deposits", "withdrawals", "income", "growth",
    "commission", "rewards", "ranks", "autopool", "token", "treasury", "liquidity",
    "rules", "reports", "reconciliation", "notifications", "support", "admin_users",
    "audit", "settings", "health", "emergency",
]

ROLE_PERMS = {
    "SUPER_ADMIN": {m: "edit" for m in MODULES},
    "FINANCE_ADMIN": {
        **{m: "view" for m in MODULES},
        "deposits": "edit", "withdrawals": "edit", "income": "edit", "treasury": "edit",
        "reports": "edit", "reconciliation": "edit", "liquidity": "edit",
    },
    "MLM_ADMIN": {
        **{m: "view" for m in MODULES},
        "members": "edit", "mlm": "edit", "rewards": "edit", "commission": "edit",
        "autopool": "edit", "growth": "edit", "ranks": "edit",
    },
    "OPERATIONS_ADMIN": {
        **{m: "view" for m in MODULES},
        "members": "edit", "support": "edit", "notifications": "edit", "token": "edit",
        "autopool": "edit", "emergency": "edit",
    },
    "SUPPORT_ADMIN": {
        "dashboard": "view", "members": "view", "deposits": "view", "withdrawals": "view",
        "income": "view", "support": "edit", "notifications": "edit",
    },
    "VIEW_ONLY": {m: "view" for m in MODULES},
}


def has_perm(role, module, write=False):
    perms = ROLE_PERMS.get(role, {})
    lvl = perms.get(module)
    if not lvl:
        return False
    return lvl == "edit" if write else lvl in ("edit", "view")


def build_admin_router(d):
    r = APIRouter(prefix="/api/admin")
    db = d.db

    async def current_admin(m: dict = Depends(d.current_member)):
        au = await db.admin_users.find_one({"_id": m["_id"], "status": "active"})
        if not au:
            raise HTTPException(403, "Not an authorized admin")
        au["_member"] = m
        return au

    def require(module, write=False):
        async def dep(au: dict = Depends(current_admin)):
            if not has_perm(au["role"], module, write):
                raise HTTPException(403, f"Your role ({au['role']}) lacks {'write' if write else 'read'} access to {module}")
            return au
        return dep

    async def audit(au, action, module, target=None, meta=None, request: Request = None):
        ip = None
        if request:
            ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else None)
        await db.audit_logs.insert_one({
            "_id": secrets.token_hex(10), "admin_address": au["_id"], "admin_name": au.get("name"),
            "role": au["role"], "action": action, "module": module, "target": target,
            "meta": meta or {}, "ip": ip, "created_at": d.iso(d.now_utc()),
        })

    # ------------------------- me / roles -------------------------
    @r.get("/me")
    async def me(au: dict = Depends(current_admin)):
        await db.admin_users.update_one({"_id": au["_id"]}, {"$set": {"last_login": d.iso(d.now_utc())}})
        return {"address": au["address"], "email": au.get("email"), "name": au.get("name"),
                "role": au["role"], "permissions": ROLE_PERMS.get(au["role"], {}),
                "modules": MODULES, "twofa_enabled": au.get("twofa_enabled", False)}

    @r.get("/roles")
    async def roles(au: dict = Depends(require("admin_users"))):
        return {"roles": ROLE_PERMS, "modules": MODULES}

    # ------------------------- dashboard -------------------------
    @r.get("/dashboard")
    async def dashboard(au: dict = Depends(require("dashboard"))):
        members = await db.members.find({}).to_list(10000)
        total = len(members)
        active = sum(1 for x in members if x["status"] == "active")
        inactive = total - active
        today = d.now_utc().date().isoformat()
        new_today = sum(1 for x in members if (x.get("joined_at") or "")[:10] == today)
        txs = await db.transactions.find({}).to_list(20000)
        dep_total = sum(t["amount"] for t in txs if t["type"] == "deposit")
        wd_total = sum(-t["amount"] for t in txs if t["type"] == "withdraw")
        pending_wd = await db.withdrawals.count_documents({"status": {"$in": ["pending", "under_review"]}})
        biz_volume = sum(x["team_volume"] for x in members if x.get("placement_parent") is None)
        dist = {"referral": 0.0, "profit_growth": 0.0, "pg_commission": 0.0, "reward": 0.0, "autopool": 0.0}
        for x in members:
            for k in dist:
                dist[k] += x["income"].get(k, 0.0)
        ap_total = await db.autopool.count_documents({})
        ap_active = await db.autopool.count_documents({"status": "active"})
        ap_done = await db.autopool.count_documents({"status": "completed"})

        # charts: daily registrations & deposit/withdraw volume last 14 days
        from collections import defaultdict
        reg = defaultdict(int); depv = defaultdict(float); wdv = defaultdict(float)
        for x in members:
            reg[(x.get("joined_at") or "")[:10]] += 1
        for t in txs:
            dkey = (t.get("created_at") or "")[:10]
            if t["type"] == "deposit": depv[dkey] += t["amount"]
            if t["type"] == "withdraw": wdv[dkey] += -t["amount"]
        days = sorted(set(list(reg) + list(depv) + list(wdv)))[-14:]
        cum = 0; growth = []
        for day in days:
            cum += reg.get(day, 0)
            growth.append({"date": day, "registrations": reg.get(day, 0), "members": cum,
                           "deposits": round(depv.get(day, 0), 2), "withdrawals": round(wdv.get(day, 0), 2)})
        return {
            "kpis": {
                "total_members": total, "active_members": active, "inactive_members": inactive, "new_today": new_today,
                "total_deposits": round(dep_total, 2), "total_withdrawals": round(wd_total, 2),
                "pending_withdrawals": pending_wd, "business_volume": round(biz_volume, 2),
                "referral_distributed": round(dist["referral"], 2), "growth_distributed": round(dist["profit_growth"], 2),
                "commission_distributed": round(dist["pg_commission"], 2), "rewards_distributed": round(dist["reward"], 2),
                "autopool_members": ap_total, "active_positions": ap_active, "completed_cycles": ap_done,
            },
            "income_distribution": {k: round(v, 2) for k, v in dist.items()},
            "chart": growth,
            "active_vs_inactive": {"active": active, "inactive": inactive},
        }

    # ------------------------- members -------------------------
    @r.get("/members")
    async def members(status: Optional[str] = None, search: Optional[str] = None,
                      sort: str = "joined_at", au: dict = Depends(require("members"))):
        q = {}
        if status and status != "all":
            q["status"] = status
        if search:
            q["_id"] = {"$regex": search.lower()}
        sort_field = {"volume": "team_volume", "team": "team_count", "balance": "available",
                      "joined_at": "joined_at"}.get(sort, "joined_at")
        docs = await db.members.find(q).sort(sort_field, -1).to_list(2000)
        return [{"address": x["address"], "member_id": x["address"][-8:], "short": d.short(x["address"]),
                 "status": x["status"], "rank": x["rank"],
                 "sponsor": d.short(x["sponsor"]) if x.get("sponsor") else None,
                 "joined_at": x["joined_at"], "team_size": x["team_count"],
                 "business_volume": round(x["team_volume"], 2), "balance": round(x["available"], 2),
                 "principal": round(x["principal"], 2), "last_activity": x.get("last_withdraw_at") or x["joined_at"],
                 "is_admin": bool(x.get("is_admin"))} for x in docs]

    @r.get("/members/{address}")
    async def member_detail(address: str, au: dict = Depends(require("members"))):
        x = await db.members.find_one({"_id": address.lower()})
        if not x:
            raise HTTPException(404, "Member not found")
        sp = await db.members.find_one({"_id": x["sponsor"]}) if x.get("sponsor") else None
        txs = await db.transactions.find({"address": x["_id"]}).sort("created_at", -1).to_list(200)
        deposits = sum(t["amount"] for t in txs if t["type"] == "deposit")
        withs = sum(-t["amount"] for t in txs if t["type"] == "withdraw")
        return {
            "overview": {"address": x["address"], "member_id": x["address"][-8:],
                         "sponsor": sp["address"] if sp else None, "joined_at": x["joined_at"],
                         "status": x["status"], "rank": x["rank"], "is_admin": bool(x.get("is_admin"))},
            "financial": {"total_deposits": round(deposits, 2), "total_withdrawals": round(withs, 2),
                          "available": round(x["available"], 2), "principal": round(x["principal"], 2),
                          "wallet_balance": round(x["wallet_balance"], 2),
                          "total_earned": round(d.member_total_income(x), 2), "income": {k: round(v, 2) for k, v in x["income"].items()}},
            "network": {"direct": x["direct_count"], "team": x["team_count"],
                        "left": {"members": x["left_count"], "volume": round(x["left_volume"], 2)},
                        "right": {"members": x["right_count"], "volume": round(x["right_volume"], 2)},
                        "team_volume": round(x["team_volume"], 2)},
            "activity": [{"type": t["type"], "amount": t["amount"], "status": t["status"],
                          "tx_hash": t["tx_hash"], "bscscan_url": d.BSCSCAN_BASE + t["tx_hash"],
                          "created_at": t["created_at"]} for t in txs[:50]],
            "notes": x.get("admin_notes", []),
        }

    class MemberAction(BaseModel):
        action: str
        note: Optional[str] = None

    @r.post("/members/{address}/action")
    async def member_action(address: str, body: MemberAction, request: Request,
                            au: dict = Depends(require("members", write=True))):
        mapping = {"suspend": "suspended", "activate": "active", "block": "blocked", "deactivate": "inactive"}
        if body.action == "note":
            if not body.note:
                raise HTTPException(400, "Note required")
            await db.members.update_one({"_id": address.lower()},
                {"$push": {"admin_notes": {"note": body.note, "by": au["name"], "at": d.iso(d.now_utc())}}})
            await audit(au, "add_note", "members", address, {"note": body.note}, request)
            return {"ok": True}
        if body.action not in mapping:
            raise HTTPException(400, "Invalid action")
        res = await db.members.update_one({"_id": address.lower()}, {"$set": {"status": mapping[body.action]}})
        if res.matched_count == 0:
            raise HTTPException(404, "Member not found")
        await audit(au, body.action, "members", address, {"status": mapping[body.action]}, request)
        return {"ok": True, "status": mapping[body.action]}

    # ------------------------- mlm / network -------------------------
    @r.get("/network")
    async def network(root: Optional[str] = None, au: dict = Depends(require("mlm"))):
        root_addr = root.lower() if root else d.ADMIN_DEMO_ADDRESS.lower()
        sponsor_tree = await d.build_sponsor_tree(root_addr)
        placement_tree = await d.build_placement_tree(root_addr)
        x = await db.members.find_one({"_id": root_addr})
        return {"root": root_addr, "sponsor_tree": sponsor_tree, "placement_tree": placement_tree,
                "summary": {"direct": x["direct_count"] if x else 0, "team": x["team_count"] if x else 0,
                            "left": {"members": x["left_count"], "volume": round(x["left_volume"], 2)} if x else {},
                            "right": {"members": x["right_count"], "volume": round(x["right_volume"], 2)} if x else {}}}

    @r.get("/leaderboard")
    async def leaderboard(au: dict = Depends(require("mlm"))):
        docs = await db.members.find({}).sort("team_volume", -1).limit(20).to_list(20)
        return [{"rank": i + 1, "address": d.short(x["address"]), "full": x["address"],
                 "direct": x["direct_count"], "team": x["team_count"],
                 "volume": round(x["team_volume"], 2), "member_rank": x["rank"]} for i, x in enumerate(docs)]

    # ------------------------- deposits -------------------------
    @r.get("/deposits")
    async def deposits(search: Optional[str] = None, au: dict = Depends(require("deposits"))):
        q = {"type": "deposit"}
        if search:
            q["$or"] = [{"address": {"$regex": search.lower()}}, {"tx_hash": {"$regex": search}}]
        docs = await db.transactions.find(q).sort("created_at", -1).to_list(1000)
        s = await d.get_settings()
        return [{"id": t["_id"], "tx_hash": t["tx_hash"], "bscscan_url": d.BSCSCAN_BASE + t["tx_hash"],
                 "address": d.short(t["address"]), "full": t["address"], "amount": t["amount"], "token": "MERQ",
                 "date": t["created_at"], "confirmations": s.get("block_confirmations", 12),
                 "status": "confirmed", "reconciliation": "matched"} for t in docs]

    # ------------------------- withdrawals -------------------------
    @r.get("/withdrawals")
    async def withdrawals(status: Optional[str] = None, au: dict = Depends(require("withdrawals"))):
        q = {}
        if status and status != "all":
            q["status"] = status
        docs = await db.withdrawals.find(q).sort("created_at", -1).to_list(1000)
        return [{"id": w["_id"], "address": d.short(w["address"]), "full": w["address"],
                 "amount": w["amount"], "fee": w["fee"], "protocol_fee": w["protocol_fee"],
                 "net": w["net"], "status": w["status"], "created_at": w["created_at"],
                 "tx_hash": w.get("tx_hash"), "reason": w.get("reason")} for w in docs]

    class WdAction(BaseModel):
        action: str
        reason: Optional[str] = None

    @r.post("/withdrawals/{wid}/action")
    async def withdrawal_action(wid: str, body: WdAction, request: Request,
                                au: dict = Depends(require("withdrawals", write=True))):
        w = await db.withdrawals.find_one({"_id": wid})
        if not w:
            raise HTTPException(404, "Request not found")
        act = body.action
        if act == "approve":
            if w["status"] not in ("pending", "under_review"):
                raise HTTPException(400, "Only pending/under-review requests can be approved")
            txh = d.fake_tx_hash()
            await db.withdrawals.update_one({"_id": wid}, {"$set": {"status": "completed", "tx_hash": txh}})
            await db.members.update_one({"_id": w["address"]}, {"$inc": {"wallet_balance": w["net"]}})
            await db.transactions.update_one({"meta.request_id": wid},
                {"$set": {"status": "confirmed", "tx_hash": txh}})
        elif act == "reject":
            if w["status"] in ("completed",):
                raise HTTPException(400, "Cannot reject a completed withdrawal")
            await db.withdrawals.update_one({"_id": wid}, {"$set": {"status": "rejected", "reason": body.reason}})
            await db.members.update_one({"_id": w["address"]}, {"$inc": {"available": w["amount"]}})
            await db.transactions.update_one({"meta.request_id": wid}, {"$set": {"status": "rejected"}})
        elif act == "hold":
            await db.withdrawals.update_one({"_id": wid}, {"$set": {"status": "under_review", "reason": body.reason}})
        elif act == "release":
            await db.withdrawals.update_one({"_id": wid}, {"$set": {"status": "pending"}})
        else:
            raise HTTPException(400, "Invalid action")
        await audit(au, f"withdrawal_{act}", "withdrawals", wid,
                    {"amount": w["amount"], "reason": body.reason}, request)
        return {"ok": True}

    # ------------------------- income -------------------------
    def _range_start(rng):
        now = d.now_utc()
        if rng == "today":
            return now.replace(hour=0, minute=0, second=0, microsecond=0)
        if rng == "week":
            return now - timedelta(days=7)
        if rng == "month":
            return now - timedelta(days=30)
        return None

    @r.get("/income")
    async def income(range: str = "all", au: dict = Depends(require("income"))):
        itypes = ["referral", "profit_growth", "pg_commission", "reward", "autopool"]
        start = _range_start(range)
        q = {"type": {"$in": itypes}}
        docs = await db.transactions.find(q).sort("created_at", -1).to_list(5000)
        if start:
            docs = [t for t in docs if d.parse_iso(t["created_at"]) >= start]
        by_type = {k: 0.0 for k in itypes}
        for t in docs:
            by_type[t["type"]] += t["amount"]
        total = sum(by_type.values())
        return {"range": range, "total_generated": round(total, 2),
                "by_type": {k: round(v, 2) for k, v in by_type.items()},
                "count": len(docs),
                "recent": [{"type": t["type"], "address": d.short(t["address"]), "amount": t["amount"],
                            "status": t["status"], "created_at": t["created_at"],
                            "tx_hash": t["tx_hash"], "bscscan_url": d.BSCSCAN_BASE + t["tx_hash"],
                            "meta": t.get("meta", {})} for t in docs[:100]]}

    @r.get("/income/referral")
    async def income_referral(au: dict = Depends(require("income"))):
        docs = await db.transactions.find({"type": "referral"}).sort("created_at", -1).to_list(2000)
        from collections import defaultdict
        top = defaultdict(float)
        for t in docs:
            top[t["address"]] += t["amount"]
        leaders = sorted(top.items(), key=lambda kv: -kv[1])[:10]
        return {"total": round(sum(t["amount"] for t in docs), 2),
                "top_referrers": [{"address": d.short(a), "amount": round(v, 2)} for a, v in leaders],
                "transactions": [{"member": d.short(t["address"]), "source": d.short(t.get("meta", {}).get("from", "")),
                                  "amount": t["amount"], "status": t["status"], "created_at": t["created_at"]} for t in docs[:100]]}

    # ------------------------- growth -------------------------
    @r.get("/growth")
    async def growth(au: dict = Depends(require("growth"))):
        s = await d.get_settings()
        positions = await db.positions.find({}).sort("created_at", -1).to_list(3000)
        total_amt = sum(p["amount"] for p in positions)
        active = [p for p in positions if p["status"] == "active"]
        pending = 0.0
        for p in active:
            pending += await d.accrued_for_position(p, s)
        claimed = sum(p.get("claimed", 0) for p in positions)
        return {"active_positions": len(active), "total_eligible": round(total_amt, 2),
                "growth_generated": round(claimed + pending, 2), "growth_distributed": round(claimed, 2),
                "pending_growth": round(pending, 2),
                "positions": [{"id": p["_id"], "member": d.short(p["owner"]), "amount": round(p["amount"], 2),
                               "start": p["created_at"], "daily_pct": p["daily_pct"], "term_days": p["term_days"],
                               "status": p["status"], "claimed": round(p.get("claimed", 0), 4)} for p in positions[:200]]}

    # ------------------------- commission -------------------------
    @r.get("/commission")
    async def commission(au: dict = Depends(require("commission"))):
        docs = await db.transactions.find({"type": "pg_commission"}).sort("created_at", -1).to_list(2000)
        s = await d.get_settings()
        return {"total": round(sum(t["amount"] for t in docs), 2), "count": len(docs),
                "rate": s["pg_commission_pct"], "min_directs": s["pg_commission_min_directs"],
                "transactions": [{"member": d.short(t["address"]), "source": d.short(t.get("meta", {}).get("from", "")),
                                  "amount": t["amount"], "status": t["status"], "created_at": t["created_at"]} for t in docs[:100]]}

    # ------------------------- rewards -------------------------
    @r.get("/rewards")
    async def rewards(au: dict = Depends(require("rewards"))):
        s = await d.get_settings()
        claims = await db.transactions.find({"type": "reward"}).sort("created_at", -1).to_list(2000)
        return {"tiers": s.get("reward_tiers", []),
                "total_distributed": round(sum(t["amount"] for t in claims), 2), "claim_count": len(claims),
                "claims": [{"member": d.short(t["address"]), "amount": t["amount"],
                            "achievement": t.get("meta", {}).get("achievement"), "created_at": t["created_at"]} for t in claims[:100]]}

    @r.put("/rewards/config")
    async def rewards_config(payload: dict, request: Request, au: dict = Depends(require("rewards", write=True))):
        tiers = payload.get("tiers")
        if not isinstance(tiers, list):
            raise HTTPException(400, "tiers must be a list")
        await db.settings.update_one({"_id": "global"}, {"$set": {"reward_tiers": tiers}})
        await _new_rule_version("rewards", {"tiers": tiers}, au)
        await audit(au, "update_rewards_config", "rewards", None, {"count": len(tiers)}, request)
        return {"ok": True}

    # ------------------------- ranks -------------------------
    @r.get("/ranks")
    async def ranks(au: dict = Depends(require("ranks"))):
        s = await d.get_settings()
        counts = {}
        for x in await db.members.find({}).to_list(10000):
            counts[x["rank"]] = counts.get(x["rank"], 0) + 1
        return {"tiers": s.get("rank_tiers", []), "distribution": counts}

    @r.put("/ranks")
    async def ranks_update(payload: dict, request: Request, au: dict = Depends(require("ranks", write=True))):
        tiers = payload.get("tiers")
        if not isinstance(tiers, list):
            raise HTTPException(400, "tiers must be a list")
        await db.settings.update_one({"_id": "global"}, {"$set": {"rank_tiers": tiers}})
        await audit(au, "update_ranks", "ranks", None, {"count": len(tiers)}, request)
        return {"ok": True}

    # ------------------------- autopool -------------------------
    @r.get("/autopool")
    async def autopool(au: dict = Depends(require("autopool"))):
        s = await d.get_settings()
        positions = await db.autopool.find({}).sort("slot", 1).to_list(3000)
        active = [p for p in positions if p["status"] == "active"]
        done = [p for p in positions if p["status"] == "completed"]
        return {"config": {"entry": s["autopool_entry"], "capacity": s["autopool_capacity"],
                           "reward": s["autopool_reward"], "reentry": s["autopool_reentry"]},
                "stats": {"total_positions": len(positions), "active": len(active), "completed": len(done),
                          "pool_volume": round(len(positions) * s["autopool_entry"], 2),
                          "rewards_distributed": round(len(done) * s["autopool_reward"], 2)},
                "positions": [{"id": p["_id"], "slot": p["slot"], "member": d.short(p["owner"]),
                               "filled": p.get("filled", 0), "capacity": s["autopool_capacity"],
                               "status": p["status"], "created_at": p["created_at"]} for p in positions[:300]]}

    # ------------------------- token / blockchain (simulated) -------------------------
    @r.get("/token")
    async def token(au: dict = Depends(require("token"))):
        s = await d.get_settings()
        return {"name": "MerqON", "symbol": "MERQ", "decimals": 18,
                "contract": s.get("token_contract"), "total_supply": s.get("total_supply"),
                "network": "BNB Smart Chain", "chain_id": 56, "verified": False,
                "deployment_block": None, "simulated": True}

    @r.get("/blockchain")
    async def blockchain(au: dict = Depends(require("token"))):
        txs = await db.transactions.find({}).sort("created_at", -1).to_list(50)
        return {"rpc_status": "simulated", "latest_block": 40000000 + int(time.time()) % 100000,
                "pending": await db.transactions.count_documents({"status": "pending"}),
                "failed": 0, "simulated": True,
                "transfers": [{"tx_hash": t["tx_hash"], "bscscan_url": d.BSCSCAN_BASE + t["tx_hash"],
                               "type": t["type"], "amount": t["amount"], "address": d.short(t["address"]),
                               "status": t["status"], "created_at": t["created_at"]} for t in txs]}

    # ------------------------- treasury (simulated) -------------------------
    @r.get("/treasury")
    async def treasury(au: dict = Depends(require("treasury"))):
        members = await db.members.find({}).to_list(10000)
        tvl = sum(x["principal"] for x in members)
        wd = await db.withdrawals.find({}).to_list(5000)
        today = d.now_utc().date().isoformat()
        outflow = sum(w["net"] for w in wd if w["status"] == "completed" and (w["created_at"] or "")[:10] == today)
        pending_transfers = sum(1 for w in wd if w["status"] in ("pending", "under_review"))
        nfo_balance = max(0, tvl * 0.4)
        alerts = []
        if nfo_balance < 1000:
            alerts.append({"level": "warning", "text": "Low MERQ treasury balance"})
        if outflow > 5000:
            alerts.append({"level": "warning", "text": "High daily outflow"})
        return {"treasury_wallet": d.ADMIN_DEMO_ADDRESS, "merq_balance": round(nfo_balance, 2),
                "bnb_balance": 12.5, "pending_transfers": pending_transfers, "daily_outflow": round(outflow, 2),
                "alerts": alerts, "simulated": True,
                "note": "Treasury keys are NOT stored in the admin panel. Outflows require multisig/secure signer."}

    @r.get("/liquidity")
    async def liquidity(au: dict = Depends(require("liquidity"))):
        return {"available": False, "simulated": True,
                "message": "Liquidity module activates when the on-chain liquidity contract is deployed.",
                "merq_liquidity": 0, "bnb_liquidity": 0, "pool_value": 0, "lp_position": 0}

    # ------------------------- business rules + versioning -------------------------
    async def _new_rule_version(rtype, params, au):
        last = await db.rule_versions.find({"type": rtype}).sort("version", -1).to_list(1)
        ver = (last[0]["version"] + 1) if last else 1
        await db.rule_versions.update_many({"type": rtype, "active": True}, {"$set": {"active": False}})
        await db.rule_versions.insert_one({
            "_id": secrets.token_hex(8), "type": rtype, "version": ver, "params": params,
            "effective_from": d.iso(d.now_utc()), "created_by": au.get("name", "admin"),
            "created_at": d.iso(d.now_utc()), "active": True})
        return ver

    @r.get("/rules")
    async def rules(au: dict = Depends(require("rules"))):
        s = await d.get_settings()
        versions = await db.rule_versions.find({}).sort("version", -1).to_list(500)
        return {
            "current": {
                "referral": {"direct_referral_pct": s["referral_pct"]},
                "growth": {"daily_pct": s["profit_growth_daily_pct"], "term_days": s["profit_growth_term_days"]},
                "commission": {"pct": s["pg_commission_pct"], "min_directs": s["pg_commission_min_directs"]},
                "autopool": {"entry": s["autopool_entry"], "capacity": s["autopool_capacity"], "reward": s["autopool_reward"]},
                "withdrawal": {"min": s["min_withdraw"], "max_daily": s["daily_withdraw_limit"],
                               "fee_pct": s["withdraw_fee_pct"], "protocol_fee_pct": s["protocol_fee_pct"],
                               "cooldown_hours": s["withdraw_cooldown_hours"], "auto_approve_under": s.get("withdraw_auto_approve_under")},
            },
            "versions": [{"id": v["_id"], "type": v["type"], "version": v["version"], "params": v["params"],
                          "effective_from": v["effective_from"], "created_by": v["created_by"], "active": v["active"]} for v in versions],
        }

    class RuleVersion(BaseModel):
        type: str
        params: dict

    _RULE_SETTING_MAP = {
        "referral": lambda p: {"referral_pct": float(p["direct_referral_pct"])},
        "growth": lambda p: {"profit_growth_daily_pct": float(p["daily_pct"]), "profit_growth_term_days": int(p["term_days"])},
        "commission": lambda p: {"pg_commission_pct": float(p["pct"]), "pg_commission_min_directs": int(p["min_directs"])},
        "autopool": lambda p: {"autopool_entry": float(p["entry"]), "autopool_capacity": int(p["capacity"]), "autopool_reward": float(p["reward"])},
        "withdrawal": lambda p: {"min_withdraw": float(p["min"]), "daily_withdraw_limit": float(p["max_daily"]),
                                 "withdraw_fee_pct": float(p["fee_pct"]), "withdraw_cooldown_hours": int(p["cooldown_hours"]),
                                 "withdraw_auto_approve_under": float(p.get("auto_approve_under", 1000))},
    }

    @r.post("/rules/version")
    async def create_rule_version(body: RuleVersion, request: Request, au: dict = Depends(require("rules", write=True))):
        if body.type not in _RULE_SETTING_MAP:
            raise HTTPException(400, "Unknown rule type")
        try:
            setting_update = _RULE_SETTING_MAP[body.type](body.params)
        except (KeyError, ValueError, TypeError):
            raise HTTPException(400, "Invalid params for rule type")
        await db.settings.update_one({"_id": "global"}, {"$set": setting_update})
        ver = await _new_rule_version(body.type, body.params, au)
        await audit(au, "new_rule_version", "rules", body.type, {"version": ver, "params": body.params}, request)
        return {"ok": True, "version": ver}

    # ------------------------- reports + CSV -------------------------
    async def _report_rows(rtype):
        if rtype == "deposits":
            docs = await db.transactions.find({"type": "deposit"}).sort("created_at", -1).to_list(5000)
            return ["date", "member", "amount", "tx_hash"], [[t["created_at"], t["address"], t["amount"], t["tx_hash"]] for t in docs]
        if rtype == "withdrawals":
            docs = await db.withdrawals.find({}).sort("created_at", -1).to_list(5000)
            return ["id", "member", "amount", "net", "status", "date"], [[w["_id"], w["address"], w["amount"], w["net"], w["status"], w["created_at"]] for w in docs]
        if rtype == "income":
            docs = await db.transactions.find({"type": {"$in": ["referral", "profit_growth", "pg_commission", "reward", "autopool"]}}).sort("created_at", -1).to_list(8000)
            return ["date", "member", "type", "amount"], [[t["created_at"], t["address"], t["type"], t["amount"]] for t in docs]
        if rtype == "members":
            docs = await db.members.find({}).sort("joined_at", -1).to_list(8000)
            return ["address", "status", "rank", "sponsor", "team", "volume", "joined"], \
                   [[x["address"], x["status"], x["rank"], x.get("sponsor"), x["team_count"], round(x["team_volume"], 2), x["joined_at"]] for x in docs]
        raise HTTPException(404, "Unknown report")

    @r.get("/reports/{rtype}")
    async def report(rtype: str, au: dict = Depends(require("reports"))):
        cols, rows = await _report_rows(rtype)
        return {"type": rtype, "columns": cols, "rows": rows[:500], "total": len(rows)}

    @r.get("/reports/{rtype}/export")
    async def report_export(rtype: str, au: dict = Depends(require("reports"))):
        cols, rows = await _report_rows(rtype)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(cols)
        w.writerows(rows)
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": f"attachment; filename=merqon_{rtype}.csv"})

    # ------------------------- reconciliation (simulated) -------------------------
    @r.get("/reconciliation")
    async def reconciliation(au: dict = Depends(require("reconciliation"))):
        deps = await db.transactions.find({"type": "deposit"}).sort("created_at", -1).to_list(500)
        rows = [{"tx_hash": t["tx_hash"], "bscscan_url": d.BSCSCAN_BASE + t["tx_hash"],
                 "ledger_amount": t["amount"], "chain_amount": t["amount"], "status": "matched",
                 "created_at": t["created_at"]} for t in deps]
        return {"summary": {"matched": len(rows), "mismatch": 0, "pending": 0, "manual_review": 0},
                "rows": rows[:200], "simulated": True}

    # ------------------------- notifications (derived) -------------------------
    @r.get("/notifications")
    async def notifications(au: dict = Depends(require("notifications"))):
        alerts = []
        pending = await db.withdrawals.count_documents({"status": {"$in": ["pending", "under_review"]}})
        if pending:
            alerts.append({"level": "info", "icon": "wallet", "text": f"{pending} withdrawal(s) awaiting approval", "created_at": d.iso(d.now_utc())})
        large = await db.withdrawals.find({"status": "pending", "amount": {"$gt": 1000}}).to_list(10)
        for w in large:
            alerts.append({"level": "warning", "icon": "alert", "text": f"Large withdrawal {w['amount']} MERQ from {d.short(w['address'])}", "created_at": w["created_at"]})
        new_today = await db.members.count_documents({"joined_at": {"$regex": "^" + d.now_utc().date().isoformat()}})
        if new_today > 5:
            alerts.append({"level": "info", "icon": "users", "text": f"New member spike: {new_today} today", "created_at": d.iso(d.now_utc())})
        s = await d.get_settings()
        for k, v in s.get("emergency", {}).items():
            if v:
                alerts.append({"level": "critical", "icon": "alert", "text": f"Emergency control active: {k}", "created_at": d.iso(d.now_utc())})
        return {"notifications": alerts, "count": len(alerts)}

    # ------------------------- support tickets -------------------------
    @r.get("/tickets")
    async def tickets(status: Optional[str] = None, au: dict = Depends(require("support"))):
        q = {}
        if status and status != "all":
            q["status"] = status
        docs = await db.tickets.find(q).sort("created_at", -1).to_list(500)
        return [{"id": t["_id"], "member": d.short(t.get("address", "")), "category": t["category"],
                 "priority": t["priority"], "subject": t["subject"], "status": t["status"],
                 "assigned": t.get("assigned"), "created_at": t["created_at"], "updated_at": t["updated_at"]} for t in docs]

    class TicketUpdate(BaseModel):
        status: Optional[str] = None
        assigned: Optional[str] = None

    @r.put("/tickets/{tid}")
    async def update_ticket(tid: str, body: TicketUpdate, request: Request, au: dict = Depends(require("support", write=True))):
        upd = {k: v for k, v in body.model_dump().items() if v is not None}
        upd["updated_at"] = d.iso(d.now_utc())
        res = await db.tickets.update_one({"_id": tid}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "Ticket not found")
        await audit(au, "update_ticket", "support", tid, upd, request)
        return {"ok": True}

    # ------------------------- admin users & roles -------------------------
    @r.get("/admins")
    async def admins(au: dict = Depends(require("admin_users"))):
        docs = await db.admin_users.find({}).to_list(200)
        return [{"address": a["address"], "short": d.short(a["address"]), "email": a.get("email"),
                 "name": a.get("name"), "role": a["role"], "status": a["status"],
                 "last_login": a.get("last_login"), "twofa_enabled": a.get("twofa_enabled", False)} for a in docs]

    class NewAdmin(BaseModel):
        address: str
        email: Optional[str] = None
        name: str
        role: str

    @r.post("/admins")
    async def create_admin(body: NewAdmin, request: Request, au: dict = Depends(require("admin_users", write=True))):
        if body.role not in ROLE_PERMS:
            raise HTTPException(400, "Invalid role")
        addr = body.address.lower()
        if not addr.startswith("0x") or len(addr) != 42:
            raise HTTPException(400, "Invalid wallet address")
        await db.admin_users.update_one({"_id": addr}, {"$set": {
            "_id": addr, "address": body.address, "email": body.email, "name": body.name,
            "role": body.role, "status": "active", "twofa_enabled": False,
            "created_at": d.iso(d.now_utc()), "last_login": None}}, upsert=True)
        # ensure member record exists so they can authenticate
        existing = await db.members.find_one({"_id": addr})
        if not existing:
            s = await d.get_settings()
            await db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": addr}})
        await audit(au, "create_admin", "admin_users", addr, {"role": body.role}, request)
        return {"ok": True}

    class UpdateAdmin(BaseModel):
        role: Optional[str] = None
        status: Optional[str] = None

    @r.put("/admins/{address}")
    async def update_admin(address: str, body: UpdateAdmin, request: Request, au: dict = Depends(require("admin_users", write=True))):
        addr = address.lower()
        if addr == d.ADMIN_DEMO_ADDRESS.lower() and body.role and body.role != "SUPER_ADMIN":
            raise HTTPException(400, "Cannot change the root Super Admin role")
        upd = {k: v for k, v in body.model_dump().items() if v is not None}
        if "role" in upd and upd["role"] not in ROLE_PERMS:
            raise HTTPException(400, "Invalid role")
        res = await db.admin_users.update_one({"_id": addr}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "Admin not found")
        await audit(au, "update_admin", "admin_users", addr, upd, request)
        return {"ok": True}

    @r.delete("/admins/{address}")
    async def delete_admin(address: str, request: Request, au: dict = Depends(require("admin_users", write=True))):
        addr = address.lower()
        if addr == d.ADMIN_DEMO_ADDRESS.lower():
            raise HTTPException(400, "Cannot remove the root Super Admin")
        await db.admin_users.delete_one({"_id": addr})
        await db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": addr}})
        await audit(au, "delete_admin", "admin_users", addr, {}, request)
        return {"ok": True}

    # ------------------------- audit logs -------------------------
    @r.get("/audit")
    async def audit_logs(limit: int = Query(200, le=1000), au: dict = Depends(require("audit"))):
        docs = await db.audit_logs.find({}).sort("created_at", -1).to_list(limit)
        return [{"id": a["_id"], "admin": a.get("admin_name"), "admin_address": d.short(a["admin_address"]),
                 "role": a.get("role"), "action": a["action"], "module": a["module"],
                 "target": a.get("target"), "ip": a.get("ip"), "meta": a.get("meta", {}),
                 "created_at": a["created_at"]} for a in docs]

    # ------------------------- system settings -------------------------
    @r.get("/system")
    async def system(au: dict = Depends(require("settings"))):
        s = await d.get_settings()
        return {"platform_name": s.get("platform_name"), "timezone": s.get("timezone"),
                "maintenance_mode": s.get("maintenance_mode"), "block_confirmations": s.get("block_confirmations"),
                "chain_id": 56, "token_contract": s.get("token_contract"),
                "merq_price_usd": s.get("merq_price_usd"), "starting_wallet_balance": s.get("starting_wallet_balance")}

    @r.put("/system")
    async def system_update(payload: dict, request: Request, au: dict = Depends(require("settings", write=True))):
        allowed = {"platform_name", "timezone", "maintenance_mode", "block_confirmations",
                   "token_contract", "merq_price_usd", "starting_wallet_balance"}
        upd = {k: v for k, v in payload.items() if k in allowed}
        if upd:
            await db.settings.update_one({"_id": "global"}, {"$set": upd})
        await audit(au, "update_system", "settings", None, upd, request)
        return {"ok": True}

    # ------------------------- system health -------------------------
    @r.get("/health")
    async def health(au: dict = Depends(require("health"))):
        services = {}
        t0 = time.time()
        try:
            await db.command("ping")
            db_ms = round((time.time() - t0) * 1000, 1)
            services["mongodb"] = {"status": "online", "latency_ms": db_ms}
        except Exception:
            services["mongodb"] = {"status": "offline", "latency_ms": None}
        bnb = None
        try:
            rr = requests.get("https://api.coingecko.com/api/v3/ping", timeout=4)
            bnb = rr.ok
        except Exception:
            bnb = False
        services["api"] = {"status": "online", "latency_ms": 1}
        services["bsc_rpc"] = {"status": "simulated", "latency_ms": None}
        services["blockchain_worker"] = {"status": "simulated", "latency_ms": None}
        services["price_feed"] = {"status": "online" if bnb else "degraded", "latency_ms": None}
        return {"services": services, "error_rate": 0.0, "queue_backlog": 0}

    # ------------------------- emergency center -------------------------
    class EmergencyToggle(BaseModel):
        control: str
        enabled: bool
        reason: str

    @r.get("/emergency")
    async def emergency_get(au: dict = Depends(require("emergency"))):
        s = await d.get_settings()
        return {"controls": s.get("emergency", {}), "maintenance_mode": s.get("maintenance_mode"), "paused": s.get("paused")}

    @r.post("/emergency")
    async def emergency_set(body: EmergencyToggle, request: Request, au: dict = Depends(require("emergency", write=True))):
        valid = {"pause_withdrawals", "pause_deposits", "pause_autopool", "pause_rewards", "disable_registration"}
        if body.control not in valid:
            raise HTTPException(400, "Invalid control")
        if not body.reason or len(body.reason) < 3:
            raise HTTPException(400, "A reason is required for emergency controls")
        await db.settings.update_one({"_id": "global"}, {"$set": {f"emergency.{body.control}": body.enabled}})
        await audit(au, f"emergency_{'enable' if body.enabled else 'disable'}", "emergency",
                    body.control, {"reason": body.reason}, request)
        return {"ok": True}

    # ------------------------- techpass -------------------------
    @r.get("/techpass")
    async def techpass_report(au: dict = Depends(require("deposits")), status: Optional[str] = None, q: Optional[str] = None):
        cfg, swap = await d.techpass_config(), await d.get_swap_config()
        flt = {}
        if status:
            flt["status"] = status
        if q:
            flt["address"] = {"$regex": q.lower()}
        docs = await db.techpass.find(flt).sort("created_at", -1).to_list(1000)
        for p in docs:
            if p["status"] == "pending":
                await d.techpass_refresh(p, swap)
        allp = await db.techpass.find({}, {"status": 1, "merq_amount": 1, "price_usd": 1}).to_list(100000)
        conf = [p for p in allp if p["status"] == "confirmed"]
        return {"config": cfg, "summary": {
            "sold": len(conf), "pending": sum(1 for p in allp if p["status"] == "pending"),
            "failed": sum(1 for p in allp if p["status"] in ("failed", "invalid")),
            "total_usd": round(sum(p["price_usd"] for p in conf), 2),
            "total_merq": round(sum(p["merq_amount"] for p in conf), 6)},
            "rows": [d.techpass_public(p) for p in docs]}

    @r.get("/techpass/export")
    async def techpass_export(au: dict = Depends(require("reports"))):
        docs = await db.techpass.find({}).sort("created_at", -1).to_list(100000)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["id", "wallet", "price_usd", "merq_amount", "merq_price", "price_source", "status", "tx_hash", "receive_wallet", "created_at"])
        for p in docs:
            w.writerow([p["_id"], p["address"], p["price_usd"], p["merq_amount"], p["merq_price"], p["price_source"],
                        p["status"], p["tx_hash"], p["receive_wallet"], p["created_at"]])
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                                 headers={"Content-Disposition": "attachment; filename=techpass_report.csv"})

    @r.put("/techpass/config")
    async def techpass_config_update(payload: dict, request: Request, au: dict = Depends(require("deposits", write=True))):
        from eth_utils import is_address, to_checksum_address
        cur = await d.techpass_config()
        upd = {}
        if "receive_wallet" in payload:
            v = (payload["receive_wallet"] or "").strip()
            if not is_address(v):
                raise HTTPException(400, "Token receiving address is not a valid wallet address")
            upd["receive_wallet"] = to_checksum_address(v)
        if "price_usd" in payload:
            try:
                v = float(payload["price_usd"])
            except (TypeError, ValueError):
                raise HTTPException(400, "Price must be a number")
            if not 1 <= v <= 100000:
                raise HTTPException(400, "Price must be between 1 and 100000 USD")
            upd["price_usd"] = v
        if "enabled" in payload:
            upd["enabled"] = bool(payload["enabled"])
        new = {**cur, **upd}
        await db.settings.update_one({"_id": "global"}, {"$set": {"techpass": new}})
        await audit(au, "update_techpass_config", "deposits", None, upd, request)
        return {"ok": True, "config": new}

    # ------------------------- swap config -------------------------
    @r.get("/swap")
    async def swap_get(au: dict = Depends(require("token"))):
        c = await d.get_swap_config()
        docs = await db.swaps.find({}).sort("created_at", -1).to_list(100)
        return {"config": c, "recent": [
            {"tx_hash": x["_id"], "address": x["address"], "direction": x["direction"], "amount_in": x["amount_in"],
             "amount_out_est": x["amount_out_est"], "fee_amount": x["fee_amount"], "status": x["status"],
             "created_at": x["created_at"], "bscscan_url": f"{d.BSCSCAN_BASE}{x['_id']}"} for x in docs]}

    @r.put("/swap")
    async def swap_update(payload: dict, request: Request, au: dict = Depends(require("token", write=True))):
        from eth_utils import is_address, to_checksum_address
        cur = await d.get_swap_config()
        upd = {}
        for k in ("merq_token_address", "usdt_token_address", "router_address", "factory_address", "fee_wallet"):
            if k in payload:
                v = (payload[k] or "").strip()
                if v and not is_address(v):
                    raise HTTPException(400, f"{k.replace('_', ' ')} is not a valid wallet/contract address")
                upd[k] = to_checksum_address(v) if v else ""
        for k, lo, hi in (("fee_pct", 0, 10), ("default_slippage_pct", 0.1, 50)):
            if k in payload:
                try:
                    v = float(payload[k])
                except (TypeError, ValueError):
                    raise HTTPException(400, f"{k} must be a number")
                if not lo <= v <= hi:
                    raise HTTPException(400, f"{k} must be between {lo} and {hi}")
                upd[k] = v
        if "enabled" in payload:
            upd["enabled"] = bool(payload["enabled"])
        if "rpc_url" in payload and str(payload["rpc_url"]).startswith("https://"):
            upd["rpc_url"] = payload["rpc_url"]
        new = {**cur, **upd}
        await db.settings.update_one({"_id": "global"}, {"$set": {"swap": new}})
        await audit(au, "update_swap_config", "token", None, upd, request)
        return {"ok": True, "config": new}

    return r
