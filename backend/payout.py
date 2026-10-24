"""On-chain MERQ payouts from the treasury wallet (key from TREASURY_PRIVATE_KEY)."""
import asyncio
import os
from decimal import Decimal

from eth_account import Account
from eth_utils import to_checksum_address

from techpass import _rpc, _call, _addr_arg


class PayoutError(Exception):
    pass


def treasury_account():
    pk = os.environ.get("TREASURY_PRIVATE_KEY", "").strip()
    if not pk:
        return None
    try:
        return Account.from_key(pk)
    except Exception:
        return None


def _balance(url, token, addr):
    return int(_call(url, token, "0x70a08231" + _addr_arg(addr)), 16)


def treasury_status(swap: dict) -> dict:
    acct = treasury_account()
    out = {"configured": bool(acct), "address": acct.address if acct else None,
           "merq_live": bool(swap.get("merq_token_address")), "merq_balance": None, "bnb_balance": None}
    if not acct:
        return out
    url = swap["rpc_url"]
    try:
        out["bnb_balance"] = int(_rpc(url, "eth_getBalance", [acct.address, "latest"]), 16) / 1e18
        if swap.get("merq_token_address"):
            dec = int(_call(url, swap["merq_token_address"], "0x313ce567"), 16)
            out["merq_balance"] = _balance(url, swap["merq_token_address"], acct.address) / 10 ** dec
    except Exception as e:
        out["error"] = str(e)[:200]
    return out


def send_merq(swap: dict, to: str, amount: float) -> str:
    acct = treasury_account()
    if not acct:
        raise PayoutError("Treasury wallet key is not configured")
    token = swap.get("merq_token_address")
    if not token:
        raise PayoutError("MERQ token is not live yet")
    url = swap["rpc_url"]
    try:
        dec = int(_call(url, token, "0x313ce567"), 16)
        wei = int(Decimal(str(amount)) * (10 ** dec))
        if _balance(url, token, acct.address) < wei:
            raise PayoutError("Treasury wallet does not hold enough MERQ")
        data = "0xa9059cbb" + _addr_arg(to) + hex(wei)[2:].rjust(64, "0")
        nonce = int(_rpc(url, "eth_getTransactionCount", [acct.address, "pending"]), 16)
        gas_price = int(_rpc(url, "eth_gasPrice", []), 16)
        gas = int(_rpc(url, "eth_estimateGas", [{"from": acct.address, "to": token, "data": data}]), 16)
        bnb = int(_rpc(url, "eth_getBalance", [acct.address, "latest"]), 16)
        if bnb < gas * gas_price:
            raise PayoutError("Treasury wallet needs more BNB for gas")
        tx = {"to": to_checksum_address(token), "value": 0, "data": data, "nonce": nonce, "gas": int(gas * 1.2),
              "gasPrice": gas_price, "chainId": int(swap.get("chain_id", 56))}
        signed = acct.sign_transaction(tx)
        raw = signed.raw_transaction.hex()
        return _rpc(url, "eth_sendRawTransaction", [raw if raw.startswith("0x") else "0x" + raw])
    except PayoutError:
        raise
    except Exception as e:
        raise PayoutError(f"Blockchain error: {str(e)[:160]}")


def receipt_status(url, tx_hash):
    rec = _rpc(url, "eth_getTransactionReceipt", [tx_hash])
    if not rec:
        return "sent"
    return "completed" if rec.get("status") == "0x1" else "payout_failed"


async def process_payout(d, wid: str) -> dict:
    """Atomically claim a withdrawal and send MERQ on-chain."""
    db = d.db
    w = await db.withdrawals.find_one_and_update(
        {"_id": wid, "status": {"$in": ["approved", "payout_failed"]}}, {"$set": {"status": "processing"}})
    if not w:
        return await db.withdrawals.find_one({"_id": wid})
    swap = await d.get_swap_config()
    try:
        txh = await asyncio.to_thread(send_merq, swap, w["address"], w["net"])
        upd = {"status": "sent", "tx_hash": txh, "reason": None, "sent_at": d.iso(d.now_utc())}
        await db.transactions.update_one({"meta.request_id": wid}, {"$set": {"status": "pending", "tx_hash": txh}})
    except PayoutError as e:
        upd = {"status": "payout_failed", "reason": str(e)}
    await db.withdrawals.update_one({"_id": wid}, {"$set": upd})
    return {**w, **upd}


async def refresh_sent(d, w: dict) -> dict:
    if w.get("status") != "sent" or not w.get("tx_hash"):
        return w
    swap = await d.get_swap_config()
    try:
        st = await asyncio.to_thread(receipt_status, swap["rpc_url"], w["tx_hash"])
    except Exception:
        return w
    if st != "sent":
        upd = {"status": st, "reason": None if st == "completed" else "Transfer reverted on-chain"}
        await d.db.withdrawals.update_one({"_id": w["_id"]}, {"$set": upd})
        await d.db.transactions.update_one({"meta.request_id": w["_id"]},
                                           {"$set": {"status": "confirmed" if st == "completed" else "failed"}})
        w = {**w, **upd}
    return w
