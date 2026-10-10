"""MerqON — Web3 membership + token utility platform (off-chain simulated engine)."""
import os
import logging
import secrets
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any

import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends
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
        s = dict(DEFAULT_SETTINGS)
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
        cfield = "left_count" if leg == "left" else "right_count"
        await db.members.update_one(
            {"_id": parent_addr},
            {"$inc": {field: amount, cfield: 0, "team_volume": amount}},
        )
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
        sponsor = None
        if req.ref and is_address(req.ref) and req.ref.lower() != addr.lower():
            sp = await db.members.find_one({"_id": req.ref.lower()})
            if sp:
                sponsor = req.ref.lower()
        # default sponsor = admin root (if exists and not admin themselves)
        if sponsor is None and not is_admin:
            root = await db.members.find_one({"is_admin": True})
            if root:
                sponsor = root["_id"]
        m = new_member_doc(addr, sponsor, settings, is_admin=is_admin)
        if sponsor:
            parent, leg = await binary_place(sponsor)
            m["placement_parent"] = parent
            m["placement_leg"] = leg
        await db.members.insert_one(m)
        # update sponsor chain counts
        if sponsor:
            await db.members.update_one({"_id": sponsor}, {"$inc": {"direct_count": 1}})
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
    if settings.get("paused"):
        raise HTTPException(400, "Protocol is paused")
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
    if settings.get("paused"):
        raise HTTPException(400, "Protocol is paused")
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
    if settings.get("paused"):
        raise HTTPException(400, "Protocol is paused")
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
    await db.members.update_one({"_id": m["_id"]}, {
        "$inc": {"available": -amt, "wallet_balance": receive},
        "$set": {"last_withdraw_at": iso(now_utc()), "withdrawn_today": used + amt, "withdrawn_today_date": today},
    })
    await record_tx(m["_id"], "withdraw", -amt, meta={"fee": round(fee, 4), "protocol_fee": round(protocol, 4),
                                                      "received": round(receive, 4)})
    return {"ok": True, "received": round(receive, 4), "fee": round(fee, 4), "protocol_fee": round(protocol, 4)}


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


# ----------------------------- admin -----------------------------
@api.get("/admin/settings")
async def admin_get_settings(m: dict = Depends(admin_member)):
    s = await get_settings()
    s.pop("_id", None)
    return s


@api.put("/admin/settings")
async def admin_update_settings(payload: dict, m: dict = Depends(admin_member)):
    payload.pop("_id", None)
    await db.settings.update_one({"_id": "global"}, {"$set": payload}, upsert=True)
    s = await get_settings()
    s.pop("_id", None)
    return s


@api.get("/admin/members")
async def admin_members(m: dict = Depends(admin_member)):
    members = await db.members.find({}).sort("joined_at", -1).to_list(1000)
    return [{"address": x["address"], "short": short(x["address"]), "status": x["status"],
             "rank": x["rank"], "sponsor": short(x["sponsor"]) if x.get("sponsor") else None,
             "joined_at": x["joined_at"], "principal": round(x["principal"], 2),
             "available": round(x["available"], 2), "direct_count": x["direct_count"],
             "team_count": x["team_count"], "team_volume": round(x["team_volume"], 2),
             "is_admin": bool(x.get("is_admin"))} for x in members]


class StatusReq(BaseModel):
    address: str
    status: str


@api.post("/admin/member/status")
async def admin_set_status(req: StatusReq, m: dict = Depends(admin_member)):
    if req.status not in ("active", "inactive", "suspended"):
        raise HTTPException(400, "Invalid status")
    r = await db.members.update_one({"_id": req.address.lower()}, {"$set": {"status": req.status}})
    if r.matched_count == 0:
        raise HTTPException(404, "Member not found")
    return {"ok": True}


@api.get("/admin/analytics")
async def admin_analytics(m: dict = Depends(admin_member)):
    total_members = await db.members.count_documents({})
    active = await db.members.count_documents({"status": "active"})
    members = await db.members.find({}).to_list(5000)
    tvl = sum(x["principal"] for x in members)
    total_paid = sum(member_total_income(x) for x in members)
    txs = await db.transactions.count_documents({})
    # income distribution
    dist = {"referral": 0.0, "profit_growth": 0.0, "pg_commission": 0.0, "reward": 0.0, "autopool": 0.0}
    for x in members:
        for k in dist:
            dist[k] += x["income"].get(k, 0.0)
    return {"total_members": total_members, "active_members": active, "tvl": round(tvl, 2),
            "total_income_paid": round(total_paid, 2), "total_transactions": txs,
            "income_distribution": {k: round(v, 2) for k, v in dist.items()}}


@api.get("/")
async def root():
    return {"name": "MerqON API", "status": "ok"}


# ----------------------------- startup -----------------------------
@app.on_event("startup")
async def startup():
    await db.members.create_index("sponsor")
    await db.members.create_index("placement_parent")
    await db.transactions.create_index("address")
    await db.positions.create_index("owner")
    await db.autopool.create_index("status")
    settings = await get_settings()
    # seed admin root member
    admin = await db.members.find_one({"_id": ADMIN_DEMO_ADDRESS.lower()})
    if not admin:
        doc = new_member_doc(ADMIN_DEMO_ADDRESS, None, settings, is_admin=True)
        doc["status"] = "active"
        await db.members.insert_one(doc)
        logger.info(f"Seeded admin root member {ADMIN_DEMO_ADDRESS}")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
