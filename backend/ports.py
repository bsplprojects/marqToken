"""Merq Entry Port & Unity Port — USDT-valued purchases paid in real MERQ (BEP-20)."""
import asyncio
import re
import secrets
from datetime import timedelta
from decimal import Decimal, ROUND_UP
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from techpass import verify_transfer

PORTS = {"entry": "Merq Entry Port", "unity": "Merq Unity Port"}
PORT_DEFAULTS = {"enabled": True, "min_usd": 10.0, "max_usd": 10000.0}
QUOTE_TTL = 600


class QuoteReq(BaseModel):
    amount_usd: float


class ConfirmReq(BaseModel):
    quote_id: str
    tx_hash: str


def build_ports(d):
    r = APIRouter(prefix="/api/ports")
    db = d.db

    async def ports_config():
        s = await d.get_settings()
        saved = s.get("ports") or {}
        return {k: {**PORT_DEFAULTS, **(saved.get(k) or {})} for k in PORTS}

    def check_port(port):
        if port not in PORTS:
            raise HTTPException(404, "Unknown port")

    def public(p):
        return {"id": p["_id"], "port": p["port"], "port_name": PORTS[p["port"]], "address": p["address"],
                "amount_usd": p["amount_usd"], "merq_amount": p["merq_amount"], "merq_price": p["merq_price"],
                "price_source": p["price_source"], "tx_hash": p["tx_hash"], "status": p["status"],
                "receive_wallet": p["receive_wallet"], "created_at": p["created_at"], "verified_at": p.get("verified_at"),
                "bscscan_url": f"{d.BSCSCAN_BASE}{p['tx_hash']}"}

    async def has_techpass(addr):
        return bool(await db.techpass.find_one({"address": addr, "status": "confirmed"}))

    async def refresh_list(docs):
        swap = await d.get_swap_config()
        for p in docs:
            if p["status"] == "pending":
                await d.techpass_refresh(p, swap, "port_purchases")
        return docs

    @r.get("/status")
    async def status(m: dict = Depends(d.current_member)):
        cfg, swap, settings = await ports_config(), await d.get_swap_config(), await d.get_settings()
        price, source, dec = await d.live_price(swap, settings)
        docs = await refresh_list(await db.port_purchases.find({"address": m["_id"]}).sort("created_at", -1).to_list(500))
        totals = {}
        for k in PORTS:
            conf = [p for p in docs if p["port"] == k and p["status"] == "confirmed"]
            totals[k] = {"count": len(conf), "usd": round(sum(p["amount_usd"] for p in conf), 2),
                         "merq": round(sum(p["merq_amount"] for p in conf), 6),
                         "pending": sum(1 for p in docs if p["port"] == k and p["status"] == "pending")}
        return {"techpass_active": await has_techpass(m["_id"]), "merq_live": bool(swap.get("merq_token_address")),
                "merq_price": price, "price_source": source, "decimals": dec,
                "token_address": swap.get("merq_token_address"), "rpc_url": swap["rpc_url"],
                "ports": {k: {"name": PORTS[k], **cfg[k]} for k in PORTS}, "totals": totals,
                "history": [public(p) for p in docs]}

    @r.post("/{port}/quote")
    async def quote(port: str, body: QuoteReq, m: dict = Depends(d.current_member)):
        check_port(port)
        cfg = (await ports_config())[port]
        swap, settings, tp = await d.get_swap_config(), await d.get_settings(), await d.techpass_config()
        if not cfg["enabled"]:
            raise HTTPException(403, f"{PORTS[port]} purchases are paused")
        if not swap.get("merq_token_address"):
            raise HTTPException(400, "MERQ token is not live yet")
        if not await has_techpass(m["_id"]):
            raise HTTPException(403, "An active Merq TechPass is required first")
        if not cfg["min_usd"] <= body.amount_usd <= cfg["max_usd"]:
            raise HTTPException(400, f"Amount must be between ${cfg['min_usd']:,.2f} and ${cfg['max_usd']:,.2f}")
        price, source, dec = await d.live_price(swap, settings)
        if price <= 0:
            raise HTTPException(503, "MERQ price unavailable")
        usd = Decimal(str(body.amount_usd)).quantize(Decimal("0.01"))
        merq = (usd / Decimal(str(price))).quantize(Decimal("0.000001"), rounding=ROUND_UP)
        q = {"_id": secrets.token_hex(12), "port": port, "address": m["_id"], "amount_usd": float(usd), "merq_price": price,
             "price_source": source, "merq_amount": float(merq), "merq_amount_wei": str(int(merq * (10 ** dec))),
             "decimals": dec, "token_address": swap["merq_token_address"], "receive_wallet": tp["receive_wallet"],
             "rpc_url": swap["rpc_url"], "expires_at": d.iso(d.now_utc() + timedelta(seconds=QUOTE_TTL)),
             "created_at": d.iso(d.now_utc())}
        await db.port_quotes.insert_one(q)
        return {k: v for k, v in q.items() if k not in ("_id", "address")} | {"quote_id": q["_id"]}

    @r.post("/{port}/confirm")
    async def confirm(port: str, body: ConfirmReq, m: dict = Depends(d.current_member)):
        check_port(port)
        if not re.fullmatch(r"0x[0-9a-fA-F]{64}", body.tx_hash):
            raise HTTPException(400, "Invalid transaction hash")
        q = await db.port_quotes.find_one({"_id": body.quote_id, "address": m["_id"], "port": port})
        if not q:
            raise HTTPException(404, "Quote not found")
        h = body.tx_hash.lower()
        if await db.port_purchases.find_one({"tx_hash": h}) or await db.techpass.find_one({"tx_hash": h}):
            raise HTTPException(409, "This transaction was already used")
        st = await asyncio.to_thread(verify_transfer, q["rpc_url"], body.tx_hash, q["token_address"], m["_id"],
                                     q["receive_wallet"], int(q["merq_amount_wei"]))
        if st in ("failed", "invalid"):
            raise HTTPException(400, "Transaction does not match this payment" if st == "invalid" else "Transaction failed on-chain")
        doc = {"_id": ("EP-" if port == "entry" else "UP-") + secrets.token_hex(4).upper(), "port": port,
               "address": m["_id"], "amount_usd": q["amount_usd"], "merq_amount": q["merq_amount"],
               "merq_amount_wei": q["merq_amount_wei"], "merq_price": q["merq_price"], "price_source": q["price_source"],
               "token_address": q["token_address"], "receive_wallet": q["receive_wallet"], "tx_hash": h, "status": st,
               "quote_id": q["_id"], "created_at": d.iso(d.now_utc()),
               "verified_at": d.iso(d.now_utc()) if st == "confirmed" else None}
        await db.port_purchases.insert_one(doc)
        await db.port_quotes.delete_one({"_id": q["_id"]})
        return public(doc)

    async def report(port: str, status: Optional[str], q: Optional[str]):
        check_port(port)
        flt = {"port": port}
        if status:
            flt["status"] = status
        if q:
            flt["address"] = {"$regex": re.escape(q.lower())}
        docs = await refresh_list(await db.port_purchases.find(flt).sort("created_at", -1).to_list(1000))
        allp = await db.port_purchases.find({"port": port}, {"status": 1, "merq_amount": 1, "amount_usd": 1, "address": 1}).to_list(100000)
        conf = [p for p in allp if p["status"] == "confirmed"]
        return {"port": port, "name": PORTS[port], "config": (await ports_config())[port], "summary": {
            "purchases": len(conf), "buyers": len({p["address"] for p in conf}),
            "pending": sum(1 for p in allp if p["status"] == "pending"),
            "failed": sum(1 for p in allp if p["status"] in ("failed", "invalid", "expired")),
            "total_usd": round(sum(p["amount_usd"] for p in conf), 2),
            "total_merq": round(sum(p["merq_amount"] for p in conf), 6)},
            "rows": [public(p) for p in docs]}

    d.ports_config = ports_config
    d.ports_report = report
    d.PORTS = PORTS
    return r
