"""Merq TechPass — $120 pass paid in real MERQ (BEP-20) via on-chain transfer."""
import asyncio
import re
import secrets
from datetime import timedelta
from decimal import Decimal, ROUND_UP

import requests
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
TECHPASS_DEFAULTS = {"enabled": True, "price_usd": 120.0, "receive_wallet": "0xc1aCA21ABDfdBF0730e73B56fe949cD2703e63ad",
                     "quote_ttl_sec": 600}


def _rpc(url, method, params):
    r = requests.post(url, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params}, timeout=8).json()
    if "error" in r:
        raise RuntimeError(r["error"])
    return r.get("result")


def _call(url, to, data):
    return _rpc(url, "eth_call", [{"to": to, "data": data}, "latest"])


def _addr_arg(a):
    return a.lower().replace("0x", "").rjust(64, "0")


def _pair_price(url, factory, base, quote):
    """Quote-token amount per 1 base token from a PancakeSwap V2 pair, or None."""
    pair = "0x" + _call(url, factory, "0xe6a43905" + _addr_arg(base) + _addr_arg(quote))[-40:]
    if int(pair, 16) == 0:
        return None
    bd, qd = int(_call(url, base, "0x313ce567"), 16), int(_call(url, quote, "0x313ce567"), 16)
    res = _call(url, pair, "0x0902f1ac")[2:]
    r0, r1 = int(res[0:64], 16), int(res[64:128], 16)
    token0 = "0x" + _call(url, pair, "0x0dfe1681")[-40:]
    rb, rq = (r0, r1) if token0.lower() == base.lower() else (r1, r0)
    if not rb or not rq:
        return None
    return (rq / 10 ** qd) / (rb / 10 ** bd)


WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"


def pool_price(swap: dict):
    """Return (usd_per_merq, merq_decimals): MERQ/USDT pool, else MERQ/BNB pool x BNB/USDT pool."""
    url, merq, usdt, f = swap["rpc_url"], swap["merq_token_address"], swap["usdt_token_address"], swap["factory_address"]
    merq_dec = int(_call(url, merq, "0x313ce567"), 16)
    p = _pair_price(url, f, merq, usdt)
    if p:
        return p, merq_dec
    wbnb = swap.get("wbnb_address") or WBNB
    in_bnb = _pair_price(url, f, merq, wbnb)
    bnb_usd = _pair_price(url, f, wbnb, usdt) if in_bnb else None
    return (in_bnb * bnb_usd if in_bnb and bnb_usd else None), merq_dec


def verify_transfer(url, tx_hash, token, sender, recipient, min_wei):
    """Return 'confirmed' | 'pending' | 'failed' | 'invalid'."""
    rec = _rpc(url, "eth_getTransactionReceipt", [tx_hash])
    if not rec:
        return "pending"
    if rec.get("status") != "0x1":
        return "failed"
    for lg in rec.get("logs", []):
        t = lg.get("topics", [])
        if (lg.get("address", "").lower() == token.lower() and len(t) == 3 and t[0] == TRANSFER_TOPIC
                and t[1][-40:].lower() == sender.lower()[2:] and t[2][-40:].lower() == recipient.lower()[2:]
                and int(lg.get("data", "0x0"), 16) >= min_wei):
            return "confirmed"
    return "invalid"


class ConfirmReq(BaseModel):
    quote_id: str
    tx_hash: str


def build_techpass(d):
    r = APIRouter(prefix="/api/techpass")
    db = d.db

    async def config():
        s = await d.get_settings()
        return {**TECHPASS_DEFAULTS, **(s.get("techpass") or {})}

    async def live_price(swap, settings):
        if swap.get("merq_token_address"):
            try:
                price, dec = await asyncio.to_thread(pool_price, swap)
                if price:
                    return price, "pancakeswap_pool", dec
                return float(settings.get("merq_price_usd") or 0), "admin_price", dec
            except Exception as e:
                d.logger.warning(f"TechPass price read failed: {e}")
        return float(settings.get("merq_price_usd") or 0), "admin_price", 18

    async def refresh_pending(p, swap, coll="techpass"):
        if p["status"] != "pending":
            return p
        st = await asyncio.to_thread(verify_transfer, swap["rpc_url"], p["tx_hash"], p["token_address"],
                                     p["address"], p["receive_wallet"], int(p["merq_amount_wei"]))
        if st == "pending" and d.parse_iso(p["created_at"]) < d.now_utc() - timedelta(minutes=30):
            st = "expired"
        if st != "pending":
            upd = {"status": st, "verified_at": d.iso(d.now_utc())}
            await db[coll].update_one({"_id": p["_id"]}, {"$set": upd})
            p.update(upd)
            if coll == "techpass" and st == "confirmed":
                await d.process_techpass_income(p)
            if coll == "port_purchases" and st == "confirmed":
                await d.process_port_income(p)
        return p

    def public(p):
        return {k: p.get(k) for k in ("_id", "address", "price_usd", "merq_amount", "merq_price", "price_source",
                                      "tx_hash", "status", "receive_wallet", "created_at", "verified_at")} | {
            "id": p["_id"], "bscscan_url": f"{d.BSCSCAN_BASE}{p['tx_hash']}"}

    async def owned(addr):
        return await db.techpass.find_one({"address": addr, "status": {"$in": ["confirmed", "pending"]}})

    @r.get("/status")
    async def status(m: dict = Depends(d.current_member)):
        cfg, swap = await config(), await d.get_swap_config()
        p = await owned(m["_id"])
        if p:
            p = await refresh_pending(p, swap)
        return {"enabled": cfg["enabled"], "price_usd": cfg["price_usd"], "merq_live": bool(swap.get("merq_token_address")),
                "purchase": public(p) if p and p["status"] in ("confirmed", "pending") else None}

    @r.post("/quote")
    async def quote(m: dict = Depends(d.current_member)):
        cfg, swap, settings = await config(), await d.get_swap_config(), await d.get_settings()
        if not cfg["enabled"]:
            raise HTTPException(403, "TechPass sales are paused")
        if not swap.get("merq_token_address"):
            raise HTTPException(400, "MERQ token is not live yet")
        if not cfg.get("receive_wallet"):
            raise HTTPException(400, "TechPass receiving wallet is not configured")
        if await owned(m["_id"]):
            raise HTTPException(409, "You already own a Merq TechPass")
        price, source, dec = await live_price(swap, settings)
        if price <= 0:
            raise HTTPException(503, "MERQ price unavailable")
        merq = (Decimal(str(cfg["price_usd"])) / Decimal(str(price))).quantize(Decimal("0.000001"), rounding=ROUND_UP)
        q = {"_id": secrets.token_hex(12), "address": m["_id"], "price_usd": cfg["price_usd"], "merq_price": price,
             "price_source": source, "merq_amount": float(merq), "merq_amount_wei": str(int(merq * (10 ** dec))),
             "decimals": dec, "token_address": swap["merq_token_address"], "receive_wallet": cfg["receive_wallet"],
             "chain_id": swap.get("chain_id", 56), "rpc_url": swap["rpc_url"],
             "expires_at": d.iso(d.now_utc() + timedelta(seconds=cfg["quote_ttl_sec"])), "created_at": d.iso(d.now_utc())}
        await db.techpass_quotes.insert_one(q)
        return {k: v for k, v in q.items() if k not in ("_id", "address")} | {"quote_id": q["_id"]}

    @r.post("/confirm")
    async def confirm(body: ConfirmReq, m: dict = Depends(d.current_member)):
        if not re.fullmatch(r"0x[0-9a-fA-F]{64}", body.tx_hash):
            raise HTTPException(400, "Invalid transaction hash")
        q = await db.techpass_quotes.find_one({"_id": body.quote_id, "address": m["_id"]})
        if not q:
            raise HTTPException(404, "Quote not found")
        if await db.techpass.find_one({"tx_hash": body.tx_hash.lower()}):
            raise HTTPException(409, "This transaction was already used")
        if await owned(m["_id"]):
            raise HTTPException(409, "You already own a Merq TechPass")
        st = await asyncio.to_thread(verify_transfer, q["rpc_url"], body.tx_hash, q["token_address"], m["_id"],
                                     q["receive_wallet"], int(q["merq_amount_wei"]))
        if st in ("failed", "invalid"):
            raise HTTPException(400, "Transaction does not match the TechPass payment" if st == "invalid" else "Transaction failed on-chain")
        doc = {"_id": "TP-" + secrets.token_hex(4).upper(), "address": m["_id"], "price_usd": q["price_usd"],
               "merq_amount": q["merq_amount"], "merq_amount_wei": q["merq_amount_wei"], "merq_price": q["merq_price"],
               "price_source": q["price_source"], "token_address": q["token_address"], "receive_wallet": q["receive_wallet"],
               "tx_hash": body.tx_hash.lower(), "status": st, "quote_id": q["_id"], "quote_expired": d.iso(d.now_utc()) > q["expires_at"],
               "created_at": d.iso(d.now_utc()), "verified_at": d.iso(d.now_utc()) if st == "confirmed" else None}
        await db.techpass.insert_one(doc)
        await db.techpass_quotes.delete_one({"_id": q["_id"]})
        if st == "confirmed":
            await d.process_techpass_income(doc)
        return public(doc)

    d.techpass_config = config
    d.techpass_refresh = refresh_pending
    d.live_price = live_price
    d.techpass_public = public
    return r
