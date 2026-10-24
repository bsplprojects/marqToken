"""MerqON — Web3 membership + token utility platform (off-chain simulated engine)."""
import os
import logging
import secrets
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any

import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import to_checksum_address, is_address

ROOT_DIR = Path(__file__).parent
from dotenv import load_dotenv
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("merqon")

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ISSUER = os.environ.get('JWT_ISSUER', 'merqon-dapp')
CHAIN_ID = int(os.environ.get('BSC_CHAIN_ID', '56'))
JWT_ALG = "HS256"
NONCE_TTL = 600
BSCSCAN_BASE = "https://bscscan.com/tx/"

# Well-known demo admin wallet (Hardhat account #0). Simulated only — no real funds.
ADMIN_DEMO_ADDRESS = to_checksum_address("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="MerqON API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=True)


# ----------------------------- defaults -----------------------------
DEFAULT_SETTINGS = {
    "_id": "global",
    "token_symbol": "MERQ",
    "chain": "BNB Smart Chain",
    "referral_pct": 5.0,
    "profit_growth_daily_pct": 0.5,
    "profit_growth_term_days": 300,
    "pg_commission_pct": 2.0,
    "pg_commission_min_directs": 2,
    "min_withdraw": 10.0,
    "withdraw_fee_pct": 5.0,
    "protocol_fee_pct": 1.0,
    "daily_withdraw_limit": 5000.0,
    "withdraw_cooldown_hours": 24,
    "autopool_entry": 50.0,
    "autopool_capacity": 3,
    "autopool_reward": 120.0,
    "autopool_reentry": True,
    "merq_price_usd": 0.10,
    "deposit_packages": [100, 500, 1000, 5000],
    "starting_wallet_balance": 10000.0,
    "paused": False,
    "withdraw_auto_approve_under": 1000.0,
    "platform_name": "MerqON",
    "timezone": "UTC",
    "maintenance_mode": False,
    "block_confirmations": 12,
    "emergency": {
        "pause_withdrawals": False,
        "pause_deposits": False,
        "pause_autopool": False,
        "pause_rewards": False,
        "disable_registration": False,
    },
    "token_contract": "0x0000000000000000000000000000000000000000",
    "swap": {
        "enabled": True,
        "merq_token_address": "",
        "usdt_token_address": "0x55d398326f99059fF775485246999027B3197955",
        "router_address": "0x10ED43C718714eb63d5aA57B78B54704E256024E",
        "factory_address": "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
        "fee_pct": 0.1,
        "fee_wallet": "0xc1aCA21ABDfdBF0730e73B56fe949cD2703e63ad",
        "default_slippage_pct": 1.0,
        "chain_id": 56,
        "rpc_url": "https://bsc-dataseed.binance.org",
    },
    "total_supply": 1000000000,
    "admin_addresses": [ADMIN_DEMO_ADDRESS.lower()],
    "reward_tiers": [
        {"key": "first_activity", "title": "First Activity", "metric": "deposit_count", "threshold": 1, "reward": 25, "icon": "sparkles"},
        {"key": "five_directs", "title": "5 Active Directs", "metric": "direct_count", "threshold": 5, "reward": 100, "icon": "users"},
        {"key": "team_25", "title": "25 Team Members", "metric": "team_count", "threshold": 25, "reward": 250, "icon": "network"},
        {"key": "volume_10k", "title": "Team Volume 10K", "metric": "team_volume", "threshold": 10000, "reward": 500, "icon": "trending-up"},
        {"key": "volume_50k", "title": "Team Volume 50K", "metric": "team_volume", "threshold": 50000, "reward": 2000, "icon": "crown"},
    ],
    "rank_tiers": [
        {"name": "Member", "min_team_volume": 0},
        {"name": "Bronze", "min_team_volume": 5000},
        {"name": "Silver", "min_team_volume": 20000},
        {"name": "Gold", "min_team_volume": 75000},
        {"name": "Diamond", "min_team_volume": 250000},
        {"name": "Ambassador", "min_team_volume": 1000000},
    ],
}


# ----------------------------- helpers -----------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


def parse_iso(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def fake_tx_hash() -> str:
    return "0x" + secrets.token_hex(32)


def short(addr: str) -> str:
    return f"{addr[:6]}...{addr[-4:]}" if addr else ""


async def get_settings() -> dict:
    s = await db.settings.find_one({"_id": "global"})
    if not s:
        await db.settings.insert_one(dict(DEFAULT_SETTINGS))
        return dict(DEFAULT_SETTINGS)
    # backfill any missing top-level default keys (schema migration)
    missing = {k: v for k, v in DEFAULT_SETTINGS.items() if k not in s}
    if missing:
        await db.settings.update_one({"_id": "global"}, {"$set": missing})
        s.update(missing)
    return s


def new_member_doc(address: str, sponsor: Optional[str], settings: dict, is_admin: bool = False) -> dict:
    return {
        "_id": address.lower(),
        "address": to_checksum_address(address),
        "sponsor": sponsor.lower() if sponsor else None,
        "placement_parent": None,
        "placement_leg": None,
        "joined_at": iso(now_utc()),
        "status": "inactive",
        "rank": "Member",
        "is_admin": is_admin,
        "wallet_balance": float(settings.get("starting_wallet_balance", 10000.0)),
        "principal": 0.0,
        "available": 0.0,
        "deposit_count": 0,
        "income": {"referral": 0.0, "profit_growth": 0.0, "pg_commission": 0.0, "reward": 0.0, "autopool": 0.0},
        "direct_count": 0,
        "team_count": 0,
        "left_count": 0,
        "right_count": 0,
        "left_volume": 0.0,
        "right_volume": 0.0,
        "team_volume": 0.0,
        "claimed_rewards": [],
        "last_withdraw_at": None,
        "withdrawn_today": 0.0,
        "withdrawn_today_date": None,
    }


def member_total_income(m: dict) -> float:
    return sum(m.get("income", {}).values())


def compute_rank(team_volume: float, settings: dict) -> str:
    rank = "Member"
    for t in settings.get("rank_tiers", []):
        if team_volume >= t["min_team_volume"]:
            rank = t["name"]
    return rank


async def record_tx(address: str, ttype: str, amount: float, status: str = "confirmed", meta: dict = None):
    doc = {
        "_id": secrets.token_hex(12),
        "address": address.lower(),
        "type": ttype,
        "amount": round(amount, 6),
        "status": status,
        "tx_hash": fake_tx_hash(),
        "created_at": iso(now_utc()),
        "meta": meta or {},
    }
    await db.transactions.insert_one(doc)
    return doc


async def binary_place(sponsor_addr: str) -> tuple:
    """BFS spillover placement under sponsor; returns (parent_addr, leg)."""
    if not sponsor_addr:
        return (None, None)
    queue = [sponsor_addr.lower()]
    while queue:
        cur = queue.pop(0)
        children = await db.members.find({"placement_parent": cur}).to_list(10)
        legs = {c["placement_leg"]: c["_id"] for c in children}
        if "left" not in legs:
            return (cur, "left")
        if "right" not in legs:
            return (cur, "right")
        queue.append(legs["left"])
        queue.append(legs["right"])
    return (sponsor_addr.lower(), "left")


async def propagate_volume(member_addr: str, amount: float):
    """Walk up placement tree adding deposit volume to each ancestor's leg."""
    m = await db.members.find_one({"_id": member_addr})
    child = m
    parent_addr = m.get("placement_parent")
    while parent_addr:
        leg = child.get("placement_leg")
        field = "left_volume" if leg == "left" else "right_volume"
        await db.members.update_one(
            {"_id": parent_addr},
            {"$inc": {field: amount, "team_volume": amount}},
        )
        child = await db.members.find_one({"_id": parent_addr})
        parent_addr = child.get("placement_parent")


async def propagate_placement_counts(member_addr: str):
    """Walk up placement tree adding 1 to each ancestor's leg member count."""
    m = await db.members.find_one({"_id": member_addr})
    child = m
    parent_addr = m.get("placement_parent")
    while parent_addr:
        leg = child.get("placement_leg")
        cfield = "left_count" if leg == "left" else "right_count"
        await db.members.update_one({"_id": parent_addr}, {"$inc": {cfield: 1}})
        child = await db.members.find_one({"_id": parent_addr})
        parent_addr = child.get("placement_parent")


async def accrued_for_position(pos: dict, settings: dict) -> float:
    if pos["status"] != "active":
        return 0.0
    start = parse_iso(pos["last_accrued"])
    maturity = parse_iso(pos["created_at"]) + timedelta(days=pos["term_days"])
    end = min(now_utc(), maturity)
    if end <= start:
        return 0.0
    days = (end - start).total_seconds() / 86400.0
    return pos["amount"] * (pos["daily_pct"] / 100.0) * days


# ----------------------------- auth -----------------------------
def challenge_message(address: str, nonce: str) -> str:
    return (
        f"MerqON wants you to sign in with your BNB Smart Chain account:\n{address}\n\n"
        f"Sign this message to authenticate. This request will not trigger a blockchain "
        f"transaction or cost any gas.\n\nChain ID: {CHAIN_ID}\nNonce: {nonce}\nIssued At: {iso(now_utc())}"
    )


class NonceReq(BaseModel):
    address: str


class VerifyReq(BaseModel):
    address: str
    nonce: str
    signature: str
    ref: Optional[str] = None


def make_jwt(address: str, is_admin: bool) -> str:
    n = now_utc()
    return jwt.encode(
        {"sub": address.lower(), "admin": is_admin, "iss": JWT_ISSUER, "iat": n, "exp": n + timedelta(days=7)},
        JWT_SECRET, algorithm=JWT_ALG,
    )


async def current_member(cred: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(cred.credentials, JWT_SECRET, algorithms=[JWT_ALG], issuer=JWT_ISSUER,
                             options={"require": ["sub", "exp", "iss"]})
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired session")
    m = await db.members.find_one({"_id": payload["sub"]})
    if not m:
        raise HTTPException(404, "Member not registered")
    return m


async def admin_member(m: dict = Depends(current_member)) -> dict:
    settings = await get_settings()
    if not (m.get("is_admin") or m["_id"] in [a.lower() for a in settings.get("admin_addresses", [])]):
        raise HTTPException(403, "Admin access required")
    if not await db.admin_users.find_one({"_id": m["_id"], "status": "active"}):
        raise HTTPException(403, "Admin access required")
    return m


@api.post("/auth/nonce")
async def auth_nonce(req: NonceReq):
    if not is_address(req.address):
        raise HTTPException(400, "Invalid wallet address")
    addr = to_checksum_address(req.address)
    nonce = secrets.token_urlsafe(24)
    msg = challenge_message(addr, nonce)
    await db.nonces.insert_one({
        "address": addr.lower(), "nonce": nonce, "message": msg,
        "expires_at": iso(now_utc() + timedelta(seconds=NONCE_TTL)),
    })
    return {"message": msg, "nonce": nonce}


@api.get("/auth/lookup/{address}")
async def auth_lookup(address: str):
    if not is_address(address):
        raise HTTPException(400, "Invalid wallet address")
    m = await db.members.find_one({"_id": address.lower()}, {"_id": 1})
    settings = await get_settings()
    is_admin = address.lower() in [a.lower() for a in settings.get("admin_addresses", [])]
    return {"address": to_checksum_address(address), "registered": bool(m), "sponsor_required": not m and not is_admin}


@api.post("/auth/verify")
async def auth_verify(req: VerifyReq):
    if not is_address(req.address):
        raise HTTPException(400, "Invalid wallet address")
    addr = to_checksum_address(req.address)
    doc = await db.nonces.find_one_and_delete({"address": addr.lower(), "nonce": req.nonce})
    if not doc or parse_iso(doc["expires_at"]) < now_utc():
        raise HTTPException(401, "Nonce invalid, expired, or already used")
    try:
        recovered = Account.recover_message(encode_defunct(text=doc["message"]), signature=req.signature)
    except Exception:
        raise HTTPException(401, "Invalid signature")
    if recovered.lower() != addr.lower():
        raise HTTPException(401, "Signature does not match address")

    settings = await get_settings()
    m = await db.members.find_one({"_id": addr.lower()})
    is_new = m is None
    if is_new:
        is_admin = addr.lower() in [a.lower() for a in settings.get("admin_addresses", [])]
        if settings.get("emergency", {}).get("disable_registration") and not is_admin:
            raise HTTPException(403, "New registrations are currently disabled")
        sponsor = None
        if req.ref and is_address(req.ref) and req.ref.lower() != addr.lower():
            sp = await db.members.find_one({"_id": req.ref.lower()})
            if sp:
                sponsor = req.ref.lower()
        if sponsor is None and not is_admin:
            raise HTTPException(400, "A registered sponsor wallet is required to sign up")
        m = new_member_doc(addr, sponsor, settings, is_admin=is_admin)
        if sponsor:
            parent, leg = await binary_place(sponsor)
            m["placement_parent"] = parent
            m["placement_leg"] = leg
        await db.members.insert_one(m)
        # update sponsor chain counts
        if sponsor:
            await db.members.update_one({"_id": sponsor}, {"$inc": {"direct_count": 1}})
            await propagate_placement_counts(m["_id"])
            up = sponsor
            while up:
                await db.members.update_one({"_id": up}, {"$inc": {"team_count": 1}})
                pu = await db.members.find_one({"_id": up})
                up = pu.get("sponsor")
        logger.info(f"New member registered: {addr} sponsor={sponsor}")

    token = make_jwt(addr, bool(m.get("is_admin")))
    return {"access_token": token, "token_type": "bearer", "is_new": is_new,
            "address": m["address"], "is_admin": bool(m.get("is_admin"))}


# ----------------------------- member -----------------------------
@api.get("/member/profile")
async def member_profile(m: dict = Depends(current_member)):
    sponsor = None
    if m.get("sponsor"):
        sp = await db.members.find_one({"_id": m["sponsor"]})
        sponsor = sp["address"] if sp else m["sponsor"]
    return {
        "address": m["address"], "sponsor": sponsor, "joined_at": m["joined_at"],
        "status": m["status"], "rank": m["rank"], "is_admin": bool(m.get("is_admin")),
        "referral_code": m["address"],
    }


@api.get("/member/dashboard")
async def member_dashboard(m: dict = Depends(current_member)):
    settings = await get_settings()
    price = settings.get("merq_price_usd", 0.0)
    # add live-accruing growth to a preview number
    positions = await db.positions.find({"owner": m["_id"], "status": "active"}).to_list(1000)
    pending_growth = sum([await accrued_for_position(p, settings) for p in positions])
    total_balance = m["available"] + m["principal"]
    return {
        "token_symbol": settings["token_symbol"],
        "wallet_balance": round(m["wallet_balance"], 4),
        "available": round(m["available"], 4),
        "principal": round(m["principal"], 4),
        "total_balance": round(total_balance, 4),
        "pending_growth": round(pending_growth, 4),
        "merq_price_usd": price,
        "fiat_value": round(total_balance * price, 2),
        "income": {k: round(v, 4) for k, v in m["income"].items()},
        "total_income": round(member_total_income(m), 4),
        "network": {
            "direct_members": m["direct_count"],
            "total_team": m["team_count"],
            "active_members": await db.members.count_documents({"sponsor": m["_id"], "status": "active"}),
            "left_volume": round(m["left_volume"], 2),
            "right_volume": round(m["right_volume"], 2),
            "team_volume": round(m["team_volume"], 2),
        },
        "rank": m["rank"],
        "status": m["status"],
    }


# ----------------------------- network -----------------------------
async def build_sponsor_tree(addr: str, depth: int = 0, max_depth: int = 3) -> dict:
    m = await db.members.find_one({"_id": addr})
    if not m:
        return None
    node = {"address": m["address"], "short": short(m["address"]), "status": m["status"],
            "rank": m["rank"], "volume": round(m["team_volume"], 2), "children": []}
    if depth < max_depth:
        kids = await db.members.find({"sponsor": addr}).to_list(50)
        for k in kids:
            child = await build_sponsor_tree(k["_id"], depth + 1, max_depth)
            if child:
                node["children"].append(child)
    return node


async def build_placement_tree(addr: str, depth: int = 0, max_depth: int = 4) -> dict:
    m = await db.members.find_one({"_id": addr})
    if not m:
        return None
    node = {"address": m["address"], "short": short(m["address"]), "status": m["status"],
            "leg": m.get("placement_leg"), "children": []}
    if depth < max_depth:
        kids = await db.members.find({"placement_parent": addr}).to_list(10)
        kids_sorted = sorted(kids, key=lambda c: 0 if c.get("placement_leg") == "left" else 1)
        for k in kids_sorted:
            child = await build_placement_tree(k["_id"], depth + 1, max_depth)
            if child:
                node["children"].append(child)
    return node


@api.get("/network/tree")
async def network_tree(m: dict = Depends(current_member)):
    sponsor_tree = await build_sponsor_tree(m["_id"])
    placement_tree = await build_placement_tree(m["_id"])
    return {
        "sponsor_tree": sponsor_tree,
        "placement_tree": placement_tree,
        "summary": {
            "left": {"members": m["left_count"], "volume": round(m["left_volume"], 2)},
            "right": {"members": m["right_count"], "volume": round(m["right_volume"], 2)},
            "total_members": m["team_count"],
            "total_volume": round(m["team_volume"], 2),
            "direct_members": m["direct_count"],
        },
    }


@api.get("/network/directs")
async def network_directs(m: dict = Depends(current_member)):
    kids = await db.members.find({"sponsor": m["_id"]}).to_list(200)
    return [{"address": k["address"], "short": short(k["address"]), "status": k["status"],
             "rank": k["rank"], "joined_at": k["joined_at"], "team_volume": round(k["team_volume"], 2),
             "principal": round(k["principal"], 2)} for k in kids]


# ----------------------------- deposit -----------------------------
class DepositReq(BaseModel):
    amount: float


@api.post("/deposit")
async def deposit(req: DepositReq, m: dict = Depends(current_member)):
    settings = await get_settings()
    if settings.get("paused") or settings.get("emergency", {}).get("pause_deposits"):
        raise HTTPException(400, "Deposits are currently paused")
    amt = float(req.amount)
    if amt <= 0:
        raise HTTPException(400, "Invalid amount")
    if amt > m["wallet_balance"]:
        raise HTTPException(400, "Insufficient wallet balance")

    # move funds into protocol, create growth position
    await db.members.update_one({"_id": m["_id"]}, {
        "$inc": {"wallet_balance": -amt, "principal": amt, "deposit_count": 1},
        "$set": {"status": "active"},
    })
    pos = {
        "_id": secrets.token_hex(12), "owner": m["_id"], "amount": amt,
        "created_at": iso(now_utc()), "last_accrued": iso(now_utc()),
        "term_days": settings["profit_growth_term_days"], "daily_pct": settings["profit_growth_daily_pct"],
        "accrued": 0.0, "claimed": 0.0, "status": "active",
    }
    await db.positions.insert_one(pos)
    await record_tx(m["_id"], "deposit", amt, meta={"position_id": pos["_id"]})

    # referral + pg commission to sponsor
    if m.get("sponsor"):
        sp = await db.members.find_one({"_id": m["sponsor"]})
        if sp:
            ref_amt = amt * settings["referral_pct"] / 100.0
            inc = {"income.referral": ref_amt}
            await db.members.update_one({"_id": sp["_id"]}, {"$inc": {"available": ref_amt, **inc}})
            await record_tx(sp["_id"], "referral", ref_amt, meta={"from": m["address"]})
            if sp.get("direct_count", 0) >= settings["pg_commission_min_directs"]:
                pg_amt = amt * settings["pg_commission_pct"] / 100.0
                await db.members.update_one({"_id": sp["_id"]},
                                            {"$inc": {"available": pg_amt, "income.pg_commission": pg_amt}})
                await record_tx(sp["_id"], "pg_commission", pg_amt, meta={"from": m["address"]})

    await propagate_volume(m["_id"], amt)
    # update rank up placement chain roughly for self
    fresh = await db.members.find_one({"_id": m["_id"]})
    await db.members.update_one({"_id": m["_id"]}, {"$set": {"rank": compute_rank(fresh["team_volume"], settings)}})
    return {"ok": True, "message": f"Deposited {amt} MERQ", "principal": round(fresh['principal'], 4)}


# ----------------------------- growth positions -----------------------------
@api.get("/growth/positions")
async def growth_positions(m: dict = Depends(current_member)):
    settings = await get_settings()
    out = []
    for p in await db.positions.find({"owner": m["_id"]}).to_list(1000):
        acc = await accrued_for_position(p, settings)
        maturity = parse_iso(p["created_at"]) + timedelta(days=p["term_days"])
        out.append({
            "id": p["_id"], "amount": round(p["amount"], 4), "created_at": p["created_at"],
            "maturity": iso(maturity), "daily_pct": p["daily_pct"], "term_days": p["term_days"],
            "status": p["status"], "claimed": round(p["claimed"], 4), "claimable": round(acc, 4),
            "progress": min(100, round((now_utc() - parse_iso(p["created_at"])).total_seconds() / 86400.0 / p["term_days"] * 100, 1)),
        })
    return out


@api.post("/growth/claim")
async def growth_claim(m: dict = Depends(current_member)):
    settings = await get_settings()
    positions = await db.positions.find({"owner": m["_id"], "status": "active"}).to_list(1000)
    total = 0.0
    for p in positions:
        acc = await accrued_for_position(p, settings)
        if acc <= 0:
            continue
        total += acc
        maturity = parse_iso(p["created_at"]) + timedelta(days=p["term_days"])
        new_status = "completed" if now_utc() >= maturity else "active"
        await db.positions.update_one({"_id": p["_id"]}, {
            "$set": {"last_accrued": iso(now_utc()), "status": new_status},
            "$inc": {"claimed": acc},
        })
    if total <= 0:
        raise HTTPException(400, "Nothing to claim yet")
    await db.members.update_one({"_id": m["_id"]}, {"$inc": {"available": total, "income.profit_growth": total}})
    await record_tx(m["_id"], "profit_growth", total)
    return {"ok": True, "claimed": round(total, 6)}


# ----------------------------- rewards / achievements -----------------------------
def metric_value(m: dict, metric: str) -> float:
    if metric == "team_volume":
        return m.get("team_volume", 0.0)
    return float(m.get(metric, 0))


@api.get("/rewards")
async def rewards(m: dict = Depends(current_member)):
    settings = await get_settings()
    claimed = set(m.get("claimed_rewards", []))
    out = []
    for t in settings.get("reward_tiers", []):
        val = metric_value(m, t["metric"])
        unlocked = val >= t["threshold"]
        out.append({
            "key": t["key"], "title": t["title"], "reward": t["reward"], "icon": t.get("icon", "award"),
            "metric": t["metric"], "threshold": t["threshold"], "current": round(val, 2),
            "progress": min(100, round(val / t["threshold"] * 100, 1)) if t["threshold"] else 100,
            "unlocked": unlocked, "claimed": t["key"] in claimed,
        })
    return out


class ClaimReq(BaseModel):
    key: str


@api.post("/rewards/claim")
async def rewards_claim(req: ClaimReq, m: dict = Depends(current_member)):
    settings = await get_settings()
    tier = next((t for t in settings.get("reward_tiers", []) if t["key"] == req.key), None)
    if not tier:
        raise HTTPException(404, "Reward not found")
    if settings.get("emergency", {}).get("pause_rewards"):
        raise HTTPException(400, "Reward claims are currently paused")
    if req.key in m.get("claimed_rewards", []):
        raise HTTPException(400, "Already claimed")
    if metric_value(m, tier["metric"]) < tier["threshold"]:
        raise HTTPException(400, "Reward not unlocked yet")
    await db.members.update_one({"_id": m["_id"]}, {
        "$inc": {"available": tier["reward"], "income.reward": tier["reward"]},
        "$push": {"claimed_rewards": req.key},
    })
    await record_tx(m["_id"], "reward", tier["reward"], meta={"achievement": tier["title"]})
    return {"ok": True, "reward": tier["reward"]}


# ----------------------------- autopool -----------------------------
@api.get("/autopool")
async def autopool_status(m: dict = Depends(current_member)):
    settings = await get_settings()
    positions = await db.autopool.find({"owner": m["_id"]}).sort("created_at", 1).to_list(1000)
    all_positions = await db.autopool.count_documents({})
    completed = await db.autopool.count_documents({"owner": m["_id"], "status": "completed"})
    return {
        "entry_amount": settings["autopool_entry"],
        "capacity": settings["autopool_capacity"],
        "reward": settings["autopool_reward"],
        "pool_size": all_positions,
        "my_positions": [{"id": p["_id"], "slot": p.get("slot"), "filled": p.get("filled", 0),
                          "capacity": settings["autopool_capacity"], "status": p["status"],
                          "created_at": p["created_at"]} for p in positions],
        "completed_cycles": completed,
    }


@api.post("/autopool/enter")
async def autopool_enter(m: dict = Depends(current_member)):
    settings = await get_settings()
    if settings.get("paused") or settings.get("emergency", {}).get("pause_autopool"):
        raise HTTPException(400, "Autopool is currently paused")
    entry = settings["autopool_entry"]
    fresh = await db.members.find_one({"_id": m["_id"]})
    if fresh["available"] + fresh["wallet_balance"] < entry:
        raise HTTPException(400, "Insufficient balance to enter autopool")
    # deduct from available first then wallet
    deduct_avail = min(fresh["available"], entry)
    deduct_wallet = entry - deduct_avail
    await db.members.update_one({"_id": m["_id"]},
                                {"$inc": {"available": -deduct_avail, "wallet_balance": -deduct_wallet}})
    slot = await db.autopool.count_documents({}) + 1
    pos = {"_id": secrets.token_hex(12), "owner": m["_id"], "slot": slot,
           "filled": 0, "status": "active", "created_at": iso(now_utc())}
    await db.autopool.insert_one(pos)
    await record_tx(m["_id"], "autopool_entry", -entry, meta={"slot": slot})

    # fill earliest active incomplete parent (forced matrix)
    parent = await db.autopool.find_one({"status": "active", "_id": {"$ne": pos["_id"]},
                                         "$expr": {"$lt": ["$filled", settings["autopool_capacity"]]}},
                                        sort=[("slot", 1)])
    if parent:
        new_filled = parent.get("filled", 0) + 1
        if new_filled >= settings["autopool_capacity"]:
            await db.autopool.update_one({"_id": parent["_id"]}, {"$set": {"filled": new_filled, "status": "completed"}})
            reward = settings["autopool_reward"]
            await db.members.update_one({"_id": parent["owner"]},
                                        {"$inc": {"available": reward, "income.autopool": reward}})
            await record_tx(parent["owner"], "autopool", reward, meta={"cycle_slot": parent["slot"]})
            if settings.get("autopool_reentry"):
                reslot = await db.autopool.count_documents({}) + 1
                await db.autopool.insert_one({"_id": secrets.token_hex(12), "owner": parent["owner"],
                                              "slot": reslot, "filled": 0, "status": "active",
                                              "created_at": iso(now_utc())})
        else:
            await db.autopool.update_one({"_id": parent["_id"]}, {"$set": {"filled": new_filled}})
    return {"ok": True, "slot": slot}


# ----------------------------- income -----------------------------
@api.get("/income/summary")
async def income_summary(m: dict = Depends(current_member)):
    return {"total_earned": round(member_total_income(m), 4),
            "breakdown": {k: round(v, 4) for k, v in m["income"].items()}}


INCOME_STREAMS = {
    "tp_partner_onboarding": "Merq TechPass", "tp_momentum_booster": "Merq TechPass", "tp_global_momentum": "Merq TechPass",
    "port_partner_onboarding_rewards": "Merq Entry & Unity Port", "port_level_income": "Merq Entry & Unity Port",
    "port_rank_rewards": "Merq Entry & Unity Port",
}


@api.get("/income/streams")
async def income_streams(m: dict = Depends(current_member)):
    inc = m.get("income", {})
    return {k: round(inc.get(k, 0.0), 4) for k in INCOME_STREAMS}


@api.get("/income/stream/{key}")
async def income_stream(key: str, m: dict = Depends(current_member)):
    if key not in INCOME_STREAMS:
        raise HTTPException(404, "Unknown income stream")
    txs = await db.transactions.find({"address": m["_id"], "type": key}).sort("created_at", -1).to_list(500)
    return {"key": key, "group": INCOME_STREAMS[key], "total": round(m.get("income", {}).get(key, 0.0), 4),
            "rules_configured": False,
            "history": [{"id": t["_id"], "amount": t["amount"], "status": t["status"], "tx_hash": t["tx_hash"],
                         "bscscan_url": BSCSCAN_BASE + t["tx_hash"], "created_at": t["created_at"]} for t in txs]}



@api.get("/income/history")
async def income_history(m: dict = Depends(current_member)):
    income_types = ["referral", "profit_growth", "pg_commission", "reward", "autopool"]
    txs = await db.transactions.find({"address": m["_id"], "type": {"$in": income_types}}).sort("created_at", -1).to_list(500)
    return [{"id": t["_id"], "type": t["type"], "amount": t["amount"], "status": t["status"],
             "tx_hash": t["tx_hash"], "bscscan_url": BSCSCAN_BASE + t["tx_hash"],
             "created_at": t["created_at"], "meta": t.get("meta", {})} for t in txs]


@api.get("/transactions")
async def transactions(m: dict = Depends(current_member)):
    txs = await db.transactions.find({"address": m["_id"]}).sort("created_at", -1).to_list(500)
    return [{"id": t["_id"], "type": t["type"], "amount": t["amount"], "status": t["status"],
             "tx_hash": t["tx_hash"], "bscscan_url": BSCSCAN_BASE + t["tx_hash"],
             "created_at": t["created_at"], "meta": t.get("meta", {})} for t in txs]


# ----------------------------- withdraw -----------------------------
class WithdrawReq(BaseModel):
    amount: float


@api.get("/withdraw/quote")
async def withdraw_quote(amount: float, m: dict = Depends(current_member)):
    settings = await get_settings()
    fee = amount * settings["withdraw_fee_pct"] / 100.0
    protocol = amount * settings["protocol_fee_pct"] / 100.0
    return {"amount": round(amount, 4), "fee": round(fee, 4), "protocol_fee": round(protocol, 4),
            "receive": round(amount - fee - protocol, 4), "min_withdraw": settings["min_withdraw"],
            "available": round(m["available"], 4)}


@api.post("/withdraw/request")
async def withdraw_request(req: WithdrawReq, m: dict = Depends(current_member)):
    settings = await get_settings()
    emg = settings.get("emergency", {})
    if settings.get("paused") or emg.get("pause_withdrawals"):
        raise HTTPException(400, "Withdrawals are currently paused")
    amt = float(req.amount)
    if m["status"] != "active":
        raise HTTPException(400, "Member must be active (make a deposit first)")
    if amt < settings["min_withdraw"]:
        raise HTTPException(400, f"Minimum withdrawal is {settings['min_withdraw']} MERQ")
    if amt > m["available"]:
        raise HTTPException(400, "Insufficient available balance")
    # daily limit
    today = now_utc().date().isoformat()
    used = m["withdrawn_today"] if m.get("withdrawn_today_date") == today else 0.0
    if used + amt > settings["daily_withdraw_limit"]:
        raise HTTPException(400, f"Exceeds daily limit of {settings['daily_withdraw_limit']} MERQ")
    # cooldown
    if m.get("last_withdraw_at"):
        delta = now_utc() - parse_iso(m["last_withdraw_at"])
        if delta < timedelta(hours=settings["withdraw_cooldown_hours"]):
            hrs = settings["withdraw_cooldown_hours"] - delta.total_seconds() / 3600.0
            raise HTTPException(400, f"Cooldown active. Try again in {hrs:.1f}h")

    fee = amt * settings["withdraw_fee_pct"] / 100.0
    protocol = amt * settings["protocol_fee_pct"] / 100.0
    receive = amt - fee - protocol
    # Hold the funds (deduct available immediately)
    await db.members.update_one({"_id": m["_id"]}, {
        "$inc": {"available": -amt},
        "$set": {"last_withdraw_at": iso(now_utc()), "withdrawn_today": used + amt, "withdrawn_today_date": today},
    })
    auto = amt <= float(settings.get("withdraw_auto_approve_under", 1000))
    wid = "WD-" + secrets.token_hex(5).upper()
    status = "completed" if auto else "pending"
    txh = fake_tx_hash()
    wdoc = {
        "_id": wid, "address": m["_id"], "amount": round(amt, 4), "fee": round(fee, 4),
        "protocol_fee": round(protocol, 4), "net": round(receive, 4), "status": status,
        "created_at": iso(now_utc()), "tx_hash": txh if auto else None, "approvals": [], "reason": None,
    }
    await db.withdrawals.insert_one(wdoc)
    tx = {
        "_id": secrets.token_hex(12), "address": m["_id"], "type": "withdraw",
        "amount": round(-amt, 6), "status": "confirmed" if auto else "pending",
        "tx_hash": txh, "created_at": iso(now_utc()),
        "meta": {"request_id": wid, "fee": round(fee, 4), "protocol_fee": round(protocol, 4), "received": round(receive, 4)},
    }
    await db.transactions.insert_one(tx)
    if auto:
        await db.members.update_one({"_id": m["_id"]}, {"$inc": {"wallet_balance": receive}})
    return {"ok": True, "status": status, "request_id": wid, "received": round(receive, 4),
            "fee": round(fee, 4), "protocol_fee": round(protocol, 4),
            "message": "Withdrawal completed" if auto else "Withdrawal requested — pending admin approval"}


# ----------------------------- price -----------------------------
_price_cache = {"ts": 0, "bnb": None}


@api.get("/price")
async def price():
    settings = await get_settings()
    bnb = None
    import time
    if time.time() - _price_cache["ts"] > 120:
        try:
            r = requests.get("https://api.coingecko.com/api/v3/simple/price",
                             params={"ids": "binancecoin", "vs_currencies": "usd"}, timeout=6)
            if r.ok:
                bnb = r.json().get("binancecoin", {}).get("usd")
                _price_cache.update({"ts": time.time(), "bnb": bnb})
        except Exception as e:
            logger.warning(f"CoinGecko fetch failed: {e}")
    else:
        bnb = _price_cache["bnb"]
    return {"merq_usd": settings.get("merq_price_usd", 0.0), "bnb_usd": bnb,
            "source": "admin-configured", "bnb_source": "coingecko"}


@api.get("/")
async def root():
    return {"name": "MerqON API", "status": "ok"}


BINANCE_DATA = "https://data-api.binance.vision/api/v3"
MARKET_SYMBOLS = ["BNBUSDT", "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"]
_market_cache: dict = {}


async def _cached_get(key: str, ttl: int, url: str, params: dict):
    import time, asyncio
    hit = _market_cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    try:
        r = await asyncio.to_thread(requests.get, url, params=params, timeout=8)
        r.raise_for_status()
        _market_cache[key] = (time.time(), r.json())
    except Exception as e:
        logger.warning(f"Market fetch failed {key}: {e}")
        if not hit:
            raise HTTPException(503, "Market data temporarily unavailable")
    return _market_cache[key][1]


@api.get("/market/klines")
async def market_klines(interval: str = "1m", limit: int = 120):
    if interval not in ("1m", "5m", "15m", "1h"):
        raise HTTPException(400, "Unsupported interval")
    limit = max(30, min(limit, 300))
    raw = await _cached_get(f"k:{interval}:{limit}", 8, f"{BINANCE_DATA}/klines",
                            {"symbol": "BNBUSDT", "interval": interval, "limit": limit})
    return {"symbol": "BNB/USDT", "interval": interval, "source": "binance",
            "candles": [{"t": k[0], "o": float(k[1]), "h": float(k[2]), "l": float(k[3]),
                         "c": float(k[4]), "v": float(k[5])} for k in raw]}


async def get_swap_config() -> dict:
    s = await get_settings()
    return {**DEFAULT_SETTINGS["swap"], **(s.get("swap") or {})}


class SwapRecordReq(BaseModel):
    tx_hash: str
    direction: str
    amount_in: float
    amount_out_est: float
    fee_amount: float = 0.0
    fee_tx_hash: Optional[str] = None


def _rpc_receipt_status(rpc_url: str, tx_hash: str) -> str:
    try:
        r = requests.post(rpc_url, json={"jsonrpc": "2.0", "id": 1, "method": "eth_getTransactionReceipt",
                                         "params": [tx_hash]}, timeout=6).json()
        res = r.get("result")
        if not res:
            return "pending"
        return "confirmed" if res.get("status") == "0x1" else "failed"
    except Exception:
        return "pending"


@api.get("/swap/config")
async def swap_config():
    c = await get_swap_config()
    return {**c, "live": bool(c["enabled"] and c["merq_token_address"])}


@api.post("/swap/record")
async def swap_record(req: SwapRecordReq, m: dict = Depends(current_member)):
    import re, asyncio
    if req.direction not in ("USDT_TO_MERQ", "MERQ_TO_USDT"):
        raise HTTPException(400, "Invalid direction")
    if not re.fullmatch(r"0x[0-9a-fA-F]{64}", req.tx_hash):
        raise HTTPException(400, "Invalid transaction hash")
    if await db.swaps.find_one({"_id": req.tx_hash.lower()}):
        raise HTTPException(409, "Swap already recorded")
    c = await get_swap_config()
    status = await asyncio.to_thread(_rpc_receipt_status, c["rpc_url"], req.tx_hash)
    doc = {"_id": req.tx_hash.lower(), "address": m["_id"], "direction": req.direction,
           "amount_in": req.amount_in, "amount_out_est": req.amount_out_est, "fee_amount": req.fee_amount,
           "fee_pct": c["fee_pct"], "fee_tx_hash": req.fee_tx_hash, "status": status,
           "created_at": iso(now_utc())}
    await db.swaps.insert_one(doc)
    return {"ok": True, "status": status}


@api.get("/swap/history")
async def swap_history(m: dict = Depends(current_member)):
    import asyncio
    c = await get_swap_config()
    docs = await db.swaps.find({"address": m["_id"]}).sort("created_at", -1).to_list(50)
    out = []
    for x in docs:
        if x["status"] == "pending":
            x["status"] = await asyncio.to_thread(_rpc_receipt_status, c["rpc_url"], x["_id"])
            if x["status"] != "pending":
                await db.swaps.update_one({"_id": x["_id"]}, {"$set": {"status": x["status"]}})
        out.append({"tx_hash": x["_id"], "direction": x["direction"], "amount_in": x["amount_in"],
                    "amount_out_est": x["amount_out_est"], "fee_amount": x["fee_amount"], "status": x["status"],
                    "created_at": x["created_at"], "bscscan_url": f"{BSCSCAN_BASE}{x['_id']}"})
    return out



@api.get("/market/volume")
async def market_volume():
    import json as _json
    raw = await _cached_get("vol", 30, f"{BINANCE_DATA}/ticker/24hr",
                            {"symbols": _json.dumps(MARKET_SYMBOLS, separators=(",", ":"))})
    rows = [{"symbol": x["symbol"].replace("USDT", ""), "price": float(x["lastPrice"]),
             "change_pct": float(x["priceChangePercent"]), "quote_volume": float(x["quoteVolume"]),
             "trades": int(x["count"])} for x in raw]
    rows.sort(key=lambda r: r["quote_volume"], reverse=True)
    return {"source": "binance", "pairs": rows, "total_quote_volume": sum(r["quote_volume"] for r in rows)}


# ----------------------------- startup -----------------------------
@app.on_event("startup")
async def startup():
    await db.members.create_index("sponsor")
    await db.members.create_index("placement_parent")
    await db.transactions.create_index("address")
    await db.positions.create_index("owner")
    await db.autopool.create_index("status")
    await db.withdrawals.create_index("status")
    await db.audit_logs.create_index("created_at")
    settings = await get_settings()
    # seed admin root member
    admin = await db.members.find_one({"_id": ADMIN_DEMO_ADDRESS.lower()})
    if not admin:
        doc = new_member_doc(ADMIN_DEMO_ADDRESS, None, settings, is_admin=True)
        doc["status"] = "active"
        await db.members.insert_one(doc)
        logger.info(f"Seeded admin root member {ADMIN_DEMO_ADDRESS}")
    # seed super admin RBAC user
    su = await db.admin_users.find_one({"_id": ADMIN_DEMO_ADDRESS.lower()})
    if not su:
        await db.admin_users.insert_one({
            "_id": ADMIN_DEMO_ADDRESS.lower(),
            "address": ADMIN_DEMO_ADDRESS,
            "email": "admin@merqon.io",
            "name": "Super Admin",
            "role": "SUPER_ADMIN",
            "status": "active",
            "twofa_enabled": False,
            "created_at": iso(now_utc()),
            "last_login": None,
        })
        logger.info("Seeded SUPER_ADMIN admin user admin@merqon.io")
    # revoke admin access of the public demo key (it stays only as the network root)
    await db.admin_users.update_one({"_id": ADMIN_DEMO_ADDRESS.lower()}, {"$set": {"status": "disabled"}})
    await db.settings.update_one({"_id": "global"}, {"$pull": {"admin_addresses": ADMIN_DEMO_ADDRESS.lower()}})
    # seed owner super admin wallets from env
    owners = [to_checksum_address(a.strip()) for a in os.environ.get("OWNER_ADMIN_WALLETS", "").split(",") if a.strip()]
    for owner in owners:
        oid = owner.lower()
        await db.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": oid}})
        await db.members.update_one({"_id": oid}, {"$set": {"is_admin": True}})
        await db.admin_users.update_one({"_id": oid}, {
            "$set": {"role": "SUPER_ADMIN", "status": "active"},
            "$setOnInsert": {"address": owner, "email": None, "name": "Owner", "twofa_enabled": False,
                             "created_at": iso(now_utc()), "last_login": None},
        }, upsert=True)
        logger.info(f"Ensured owner SUPER_ADMIN {owner}")
    # seed rule versions V1 from current settings
    if await db.rule_versions.count_documents({}) == 0:
        base = [
            ("referral", {"direct_referral_pct": settings["referral_pct"]}),
            ("growth", {"daily_pct": settings["profit_growth_daily_pct"], "term_days": settings["profit_growth_term_days"]}),
            ("commission", {"pct": settings["pg_commission_pct"], "min_directs": settings["pg_commission_min_directs"]}),
            ("rewards", {"tiers": settings["reward_tiers"]}),
            ("autopool", {"entry": settings["autopool_entry"], "capacity": settings["autopool_capacity"], "reward": settings["autopool_reward"]}),
            ("withdrawal", {"min": settings["min_withdraw"], "max": settings["daily_withdraw_limit"], "fee_pct": settings["withdraw_fee_pct"], "cooldown_hours": settings["withdraw_cooldown_hours"]}),
        ]
        for rtype, params in base:
            await db.rule_versions.insert_one({
                "_id": secrets.token_hex(8), "type": rtype, "version": 1, "params": params,
                "effective_from": iso(now_utc()), "created_by": "system", "created_at": iso(now_utc()), "active": True,
            })
        logger.info("Seeded rule versions V1")
    # seed sample support tickets
    if await db.tickets.count_documents({}) == 0:
        samples = [
            {"category": "Withdrawal", "priority": "high", "subject": "Withdrawal pending too long", "status": "open"},
            {"category": "Referral", "priority": "medium", "subject": "Referral income not credited", "status": "in_progress"},
            {"category": "Wallet", "priority": "low", "subject": "Cannot connect Trust Wallet", "status": "resolved"},
        ]
        for i, s in enumerate(samples):
            await db.tickets.insert_one({
                "_id": "TKT-" + secrets.token_hex(4).upper(), "address": ADMIN_DEMO_ADDRESS.lower(),
                "assigned": None, "created_at": iso(now_utc()), "updated_at": iso(now_utc()), **s,
            })
        logger.info("Seeded sample support tickets")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)

# Admin Panel router (RBAC, audit, full modules)
import types as _types
from admin_panel import build_admin_router
from techpass import build_techpass
_admin_deps = _types.SimpleNamespace(
    db=db, get_settings=get_settings, now_utc=now_utc, iso=iso, parse_iso=parse_iso,
    short=short, record_tx=record_tx, fake_tx_hash=fake_tx_hash,
    member_total_income=member_total_income, compute_rank=compute_rank,
    build_sponsor_tree=build_sponsor_tree, build_placement_tree=build_placement_tree,
    current_member=current_member, accrued_for_position=accrued_for_position,
    BSCSCAN_BASE=BSCSCAN_BASE, ADMIN_DEMO_ADDRESS=ADMIN_DEMO_ADDRESS,
    get_swap_config=get_swap_config, logger=logger,
)
app.include_router(build_techpass(_admin_deps))
app.include_router(build_admin_router(_admin_deps))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
