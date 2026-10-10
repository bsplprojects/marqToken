"""MerqON backend API tests — covers auth, member, deposit, growth, rewards,
autopool, withdraw, network, income, price, and admin endpoints."""
import os
import time
import pytest
import requests
from eth_account import Account
from eth_account.messages import encode_defunct

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ADMIN_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


# ------------------------- helpers -------------------------
def new_wallet():
    acct = Account.create()
    return acct.address, acct.key.hex()


def sign_in(address: str, pk: str, ref: str = None):
    """Full nonce -> sign -> verify flow. Returns access_token + is_new."""
    r = requests.post(f"{API}/auth/nonce", json={"address": address}, timeout=15)
    assert r.status_code == 200, f"nonce failed: {r.status_code} {r.text}"
    data = r.json()
    msg = data["message"]
    nonce = data["nonce"]
    sig = Account.sign_message(encode_defunct(text=msg), private_key=pk).signature.hex()
    if not sig.startswith("0x"):
        sig = "0x" + sig
    body = {"address": address, "nonce": nonce, "signature": sig}
    if ref:
        body["ref"] = ref
    r2 = requests.post(f"{API}/auth/verify", json=body, timeout=15)
    assert r2.status_code == 200, f"verify failed: {r2.status_code} {r2.text}"
    return r2.json()


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


# ------------------------- fixtures -------------------------
@pytest.fixture(scope="module")
def admin_token():
    data = sign_in(ADMIN_ADDR, ADMIN_PK)
    return data["access_token"]


@pytest.fixture(scope="module")
def member():
    addr, pk = new_wallet()
    data = sign_in(addr, pk)
    return {"addr": addr, "pk": pk, "token": data["access_token"], "is_new": data["is_new"]}


# ------------------------- auth tests -------------------------
class TestAuth:
    def test_nonce_returns_message_and_nonce(self):
        addr, _ = new_wallet()
        r = requests.post(f"{API}/auth/nonce", json={"address": addr})
        assert r.status_code == 200
        j = r.json()
        assert "message" in j and "nonce" in j
        assert addr in j["message"]
        assert j["nonce"] in j["message"]

    def test_nonce_invalid_address(self):
        r = requests.post(f"{API}/auth/nonce", json={"address": "notanaddress"})
        assert r.status_code == 400

    def test_verify_invalid_signature(self):
        addr, _ = new_wallet()
        r = requests.post(f"{API}/auth/nonce", json={"address": addr}).json()
        bad_sig = "0x" + "11" * 65
        r2 = requests.post(f"{API}/auth/verify",
                           json={"address": addr, "nonce": r["nonce"], "signature": bad_sig})
        assert r2.status_code == 401

    def test_verify_reused_nonce_rejected(self):
        addr, pk = new_wallet()
        n = requests.post(f"{API}/auth/nonce", json={"address": addr}).json()
        sig = Account.sign_message(encode_defunct(text=n["message"]), private_key=pk).signature.hex()
        if not sig.startswith("0x"):
            sig = "0x" + sig
        body = {"address": addr, "nonce": n["nonce"], "signature": sig}
        r1 = requests.post(f"{API}/auth/verify", json=body)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/auth/verify", json=body)
        assert r2.status_code == 401

    def test_fresh_wallet_auto_registers_is_new(self):
        addr, pk = new_wallet()
        d = sign_in(addr, pk)
        assert d["is_new"] is True
        assert d["access_token"]
        # second sign in -> not new
        d2 = sign_in(addr, pk)
        assert d2["is_new"] is False


# ------------------------- dashboard tests -------------------------
class TestDashboard:
    def test_dashboard_structure(self, member):
        r = requests.get(f"{API}/member/dashboard", headers=auth_headers(member["token"]))
        assert r.status_code == 200
        j = r.json()
        for k in ("wallet_balance", "available", "principal", "income",
                  "network", "merq_price_usd", "fiat_value"):
            assert k in j, f"missing {k}"
        assert j["wallet_balance"] == 10000.0
        assert j["merq_price_usd"] == 0.10
        assert set(j["income"].keys()) == {"referral", "profit_growth", "pg_commission", "reward", "autopool"}

    def test_profile(self, member):
        r = requests.get(f"{API}/member/profile", headers=auth_headers(member["token"]))
        assert r.status_code == 200
        j = r.json()
        assert j["address"].lower() == member["addr"].lower()
        # default sponsor should be admin
        assert j["sponsor"] is not None


# ------------------------- deposit + referral tests -------------------------
class TestDeposit:
    def test_deposit_insufficient_rejected(self, member):
        r = requests.post(f"{API}/deposit", json={"amount": 999999},
                          headers=auth_headers(member["token"]))
        assert r.status_code == 400

    def test_deposit_invalid_amount(self, member):
        r = requests.post(f"{API}/deposit", json={"amount": -5},
                          headers=auth_headers(member["token"]))
        assert r.status_code == 400

    def test_deposit_moves_funds_and_pays_referral(self, admin_token):
        # Create fresh sponsor (member A), then referred B that deposits
        a_addr, a_pk = new_wallet()
        a = sign_in(a_addr, a_pk)
        a_tok = a["access_token"]
        b_addr, b_pk = new_wallet()
        b = sign_in(b_addr, b_pk, ref=a_addr)
        b_tok = b["access_token"]

        # confirm B's sponsor is A
        prof = requests.get(f"{API}/member/profile", headers=auth_headers(b_tok)).json()
        assert prof["sponsor"].lower() == a_addr.lower()

        # dashboard before
        a_before = requests.get(f"{API}/member/dashboard", headers=auth_headers(a_tok)).json()
        # B deposits 500
        d = requests.post(f"{API}/deposit", json={"amount": 500},
                          headers=auth_headers(b_tok))
        assert d.status_code == 200, d.text
        # B's principal updated
        b_dash = requests.get(f"{API}/member/dashboard", headers=auth_headers(b_tok)).json()
        assert b_dash["principal"] == 500.0
        assert b_dash["wallet_balance"] == 9500.0
        assert b_dash["status"] == "active"
        # A's referral increased by 5%
        a_after = requests.get(f"{API}/member/dashboard", headers=auth_headers(a_tok)).json()
        gained = a_after["income"]["referral"] - a_before["income"]["referral"]
        assert abs(gained - 25.0) < 0.001
        assert a_after["available"] >= 25.0

    def test_directs_endpoint(self, admin_token):
        # admin should have at least some directs by now
        r = requests.get(f"{API}/network/directs", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ------------------------- growth tests -------------------------
class TestGrowth:
    def test_growth_positions_and_claim(self):
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        requests.post(f"{API}/deposit", json={"amount": 1000}, headers=auth_headers(tok))
        time.sleep(2)
        r = requests.get(f"{API}/growth/positions", headers=auth_headers(tok))
        assert r.status_code == 200
        positions = r.json()
        assert len(positions) == 1
        assert positions[0]["amount"] == 1000
        # Immediately claim — may be very small amount
        c = requests.post(f"{API}/growth/claim", headers=auth_headers(tok))
        # Could be 200 (claimed) or 400 (nothing yet) depending on timing
        assert c.status_code in (200, 400)


# ------------------------- rewards tests -------------------------
class TestRewards:
    def test_rewards_list(self, member):
        r = requests.get(f"{API}/rewards", headers=auth_headers(member["token"]))
        assert r.status_code == 200
        tiers = r.json()
        assert len(tiers) >= 5
        keys = {t["key"] for t in tiers}
        assert "first_activity" in keys

    def test_claim_locked_rejected(self):
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        r = requests.post(f"{API}/rewards/claim", json={"key": "first_activity"},
                          headers=auth_headers(tok))
        assert r.status_code == 400

    def test_claim_unlocked_then_double_claim_rejected(self):
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        requests.post(f"{API}/deposit", json={"amount": 100},
                      headers=auth_headers(tok))
        r = requests.post(f"{API}/rewards/claim", json={"key": "first_activity"},
                          headers=auth_headers(tok))
        assert r.status_code == 200, r.text
        r2 = requests.post(f"{API}/rewards/claim", json={"key": "first_activity"},
                           headers=auth_headers(tok))
        assert r2.status_code == 400


# ------------------------- autopool tests -------------------------
class TestAutopool:
    def test_autopool_status_and_enter(self):
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        r = requests.get(f"{API}/autopool", headers=auth_headers(tok))
        assert r.status_code == 200
        s = r.json()
        assert s["entry_amount"] == 50.0
        before = s["pool_size"]
        e = requests.post(f"{API}/autopool/enter", headers=auth_headers(tok))
        assert e.status_code == 200, e.text
        r2 = requests.get(f"{API}/autopool", headers=auth_headers(tok))
        assert r2.json()["pool_size"] >= before + 1
        assert len(r2.json()["my_positions"]) == 1


# ------------------------- withdraw tests -------------------------
class TestWithdraw:
    def test_withdraw_quote(self, member):
        r = requests.get(f"{API}/withdraw/quote", params={"amount": 100},
                         headers=auth_headers(member["token"]))
        assert r.status_code == 200
        j = r.json()
        assert j["fee"] == 5.0
        assert j["protocol_fee"] == 1.0
        assert j["receive"] == 94.0

    def test_withdraw_requires_active_status(self):
        # fresh member -> inactive -> should be rejected
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        r = requests.post(f"{API}/withdraw/request", json={"amount": 50},
                          headers=auth_headers(tok))
        assert r.status_code == 400
        assert "active" in r.text.lower()

    def test_withdraw_min_and_success(self):
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        # deposit to go active
        requests.post(f"{API}/deposit", json={"amount": 500}, headers=auth_headers(tok))
        # claim reward to get available
        requests.post(f"{API}/rewards/claim", json={"key": "first_activity"},
                      headers=auth_headers(tok))
        # below minimum
        r = requests.post(f"{API}/withdraw/request", json={"amount": 5},
                          headers=auth_headers(tok))
        assert r.status_code == 400
        # success
        r2 = requests.post(f"{API}/withdraw/request", json={"amount": 20},
                           headers=auth_headers(tok))
        assert r2.status_code == 200, r2.text
        j = r2.json()
        assert j["received"] == 18.8  # 20 - 5% - 1%
        # cooldown now blocks another
        r3 = requests.post(f"{API}/withdraw/request", json={"amount": 15},
                           headers=auth_headers(tok))
        assert r3.status_code == 400


# ------------------------- network tests -------------------------
class TestNetwork:
    def test_network_tree(self, admin_token):
        r = requests.get(f"{API}/network/tree", headers=auth_headers(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert "sponsor_tree" in j and "placement_tree" in j and "summary" in j

    def test_build_downline_and_counts(self):
        # Build A -> B,C,D downline
        a_addr, a_pk = new_wallet()
        a_tok = sign_in(a_addr, a_pk)["access_token"]
        for _ in range(3):
            x_addr, x_pk = new_wallet()
            sign_in(x_addr, x_pk, ref=a_addr)
        a_dash = requests.get(f"{API}/member/dashboard", headers=auth_headers(a_tok)).json()
        assert a_dash["network"]["direct_members"] == 3
        # directs endpoint
        d = requests.get(f"{API}/network/directs", headers=auth_headers(a_tok)).json()
        assert len(d) == 3


# ------------------------- income + tx tests -------------------------
class TestIncome:
    def test_income_summary(self, member):
        r = requests.get(f"{API}/income/summary", headers=auth_headers(member["token"]))
        assert r.status_code == 200
        j = r.json()
        assert "total_earned" in j and "breakdown" in j

    def test_transactions_have_bscscan(self):
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        requests.post(f"{API}/deposit", json={"amount": 100}, headers=auth_headers(tok))
        r = requests.get(f"{API}/transactions", headers=auth_headers(tok))
        assert r.status_code == 200
        txs = r.json()
        assert len(txs) >= 1
        assert txs[0]["bscscan_url"].startswith("https://bscscan.com/tx/0x")


# ------------------------- price tests -------------------------
class TestPrice:
    def test_price_endpoint(self):
        r = requests.get(f"{API}/price")
        assert r.status_code == 200
        j = r.json()
        assert j["merq_usd"] == 0.10
        # bnb_usd may be None (rate limited)
        assert "bnb_usd" in j


# ------------------------- admin tests -------------------------
class TestAdmin:
    def test_admin_settings_get(self, admin_token):
        r = requests.get(f"{API}/admin/settings", headers=auth_headers(admin_token))
        assert r.status_code == 200
        s = r.json()
        assert s["referral_pct"] == 5.0

    def test_admin_settings_update_and_persist(self, admin_token):
        r = requests.put(f"{API}/admin/settings",
                         json={"referral_pct": 7.5},
                         headers=auth_headers(admin_token))
        assert r.status_code == 200
        s = r.json()
        assert s["referral_pct"] == 7.5
        # revert
        requests.put(f"{API}/admin/settings", json={"referral_pct": 5.0},
                     headers=auth_headers(admin_token))

    def test_admin_members(self, admin_token):
        r = requests.get(f"{API}/admin/members", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_admin_analytics(self, admin_token):
        r = requests.get(f"{API}/admin/analytics", headers=auth_headers(admin_token))
        assert r.status_code == 200
        j = r.json()
        for k in ("total_members", "active_members", "tvl", "income_distribution"):
            assert k in j

    def test_admin_set_status(self, admin_token):
        # pick any non-admin member
        members = requests.get(f"{API}/admin/members", headers=auth_headers(admin_token)).json()
        target = next((m for m in members if not m["is_admin"]), None)
        assert target
        # need full address — admin endpoint returned short only. Use member profile endpoint flow:
        # Instead: create fresh member and change its status.
        addr, pk = new_wallet()
        sign_in(addr, pk)
        r = requests.post(f"{API}/admin/member/status",
                          json={"address": addr, "status": "suspended"},
                          headers=auth_headers(admin_token))
        assert r.status_code == 200

    def test_non_admin_forbidden(self, member):
        r = requests.get(f"{API}/admin/settings", headers=auth_headers(member["token"]))
        assert r.status_code == 403
