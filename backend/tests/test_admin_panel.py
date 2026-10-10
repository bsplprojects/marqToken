"""MerqON Admin Panel API tests — covers RBAC, dashboard, members, MLM,
deposits/withdrawals (incl. approval), income, growth, commission, rewards (rule versioning),
ranks, autopool, token/treasury/liquidity/reconciliation (simulated), rules versioning,
reports (incl. CSV), notifications, tickets, admin users, audit logs, system, health,
emergency center + member regression (withdraw auto/pending, admin nav removal)."""
import os
import time
import pytest
import requests
from eth_account import Account
from eth_account.messages import encode_defunct

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ADMIN_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


def new_wallet():
    acct = Account.create()
    return acct.address, acct.key.hex()


def sign_in(address, pk, ref=None):
    r = requests.post(f"{API}/auth/nonce", json={"address": address}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    sig = Account.sign_message(encode_defunct(text=data["message"]), private_key=pk).signature.hex()
    if not sig.startswith("0x"):
        sig = "0x" + sig
    body = {"address": address, "nonce": data["nonce"], "signature": sig}
    if ref:
        body["ref"] = ref
    r2 = requests.post(f"{API}/auth/verify", json=body, timeout=15)
    assert r2.status_code == 200, r2.text
    return r2.json()


def h(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_token():
    return sign_in(ADMIN_ADDR, ADMIN_PK)["access_token"]


@pytest.fixture(scope="module")
def member_tok():
    addr, pk = new_wallet()
    tok = sign_in(addr, pk)["access_token"]
    return {"addr": addr, "pk": pk, "token": tok}


# --------------- RBAC / me ---------------
class TestRBAC:
    def test_me_super_admin(self, admin_token):
        r = requests.get(f"{API}/admin/me", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert j["role"] == "SUPER_ADMIN"
        assert j["email"] == "admin@merqon.io"
        assert "dashboard" in j["modules"]
        assert j["permissions"]["dashboard"] == "edit"

    def test_non_admin_403(self, member_tok):
        r = requests.get(f"{API}/admin/dashboard", headers=h(member_tok["token"]))
        assert r.status_code == 403

    def test_non_admin_me_403(self, member_tok):
        r = requests.get(f"{API}/admin/me", headers=h(member_tok["token"]))
        assert r.status_code == 403

    def test_no_auth_401(self):
        r = requests.get(f"{API}/admin/dashboard")
        assert r.status_code in (401, 403)


# --------------- Dashboard ---------------
class TestDashboard:
    def test_dashboard(self, admin_token):
        r = requests.get(f"{API}/admin/dashboard", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        for k in ("kpis", "income_distribution", "chart", "active_vs_inactive"):
            assert k in j
        assert "total_members" in j["kpis"]
        assert isinstance(j["chart"], list)


# --------------- Members ---------------
class TestMembers:
    def test_list_members(self, admin_token):
        r = requests.get(f"{API}/admin/members", headers=h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_filter_and_search(self, admin_token):
        r = requests.get(f"{API}/admin/members?status=active&search=f39", headers=h(admin_token))
        assert r.status_code == 200

    def test_member_detail_and_action(self, admin_token):
        addr, pk = new_wallet()
        sign_in(addr, pk)
        r = requests.get(f"{API}/admin/members/{addr}", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert "overview" in j and "financial" in j and "network" in j and "activity" in j
        # suspend
        r2 = requests.post(f"{API}/admin/members/{addr}/action",
                           json={"action": "suspend"}, headers=h(admin_token))
        assert r2.status_code == 200
        assert r2.json()["status"] == "suspended"
        # add note
        r3 = requests.post(f"{API}/admin/members/{addr}/action",
                           json={"action": "note", "note": "TEST_automated"}, headers=h(admin_token))
        assert r3.status_code == 200
        # verify persisted
        d = requests.get(f"{API}/admin/members/{addr}", headers=h(admin_token)).json()
        assert any("TEST_automated" in (n.get("note") or "") for n in d["notes"])
        # reactivate
        r4 = requests.post(f"{API}/admin/members/{addr}/action",
                           json={"action": "activate"}, headers=h(admin_token))
        assert r4.status_code == 200

    def test_invalid_action(self, admin_token):
        addr, pk = new_wallet()
        sign_in(addr, pk)
        r = requests.post(f"{API}/admin/members/{addr}/action",
                          json={"action": "foobar"}, headers=h(admin_token))
        assert r.status_code == 400


# --------------- MLM / Network ---------------
class TestMLM:
    def test_network(self, admin_token):
        r = requests.get(f"{API}/admin/network", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert "sponsor_tree" in j and "placement_tree" in j and "summary" in j

    def test_leaderboard(self, admin_token):
        r = requests.get(f"{API}/admin/leaderboard", headers=h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_ranks_get_and_update(self, admin_token):
        r = requests.get(f"{API}/admin/ranks", headers=h(admin_token))
        assert r.status_code == 200
        tiers = r.json()["tiers"]
        r2 = requests.put(f"{API}/admin/ranks", json={"tiers": tiers}, headers=h(admin_token))
        assert r2.status_code == 200


# --------------- Finance: Deposits/Withdrawals/Income/Reconciliation ---------------
class TestFinance:
    def test_deposits(self, admin_token):
        r = requests.get(f"{API}/admin/deposits", headers=h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_withdrawals_list(self, admin_token):
        r = requests.get(f"{API}/admin/withdrawals?status=pending", headers=h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_income_ranges(self, admin_token):
        for rng in ("today", "week", "month", "all"):
            r = requests.get(f"{API}/admin/income?range={rng}", headers=h(admin_token))
            assert r.status_code == 200
            assert r.json()["range"] == rng

    def test_income_referral(self, admin_token):
        r = requests.get(f"{API}/admin/income/referral", headers=h(admin_token))
        assert r.status_code == 200
        assert "top_referrers" in r.json()

    def test_reconciliation(self, admin_token):
        r = requests.get(f"{API}/admin/reconciliation", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert j["simulated"] is True
        assert "summary" in j


# --------------- Withdrawal approval workflow + member regression ---------------
class TestWithdrawalApproval:
    def test_auto_approve_small(self):
        # small withdraw -> auto-complete
        addr, pk = new_wallet()
        tok = sign_in(addr, pk)["access_token"]
        requests.post(f"{API}/deposit", json={"amount": 500}, headers=h(tok))
        requests.post(f"{API}/rewards/claim", json={"key": "first_activity"}, headers=h(tok))
        r = requests.post(f"{API}/withdraw/request", json={"amount": 20}, headers=h(tok))
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["status"] == "completed"

    def test_large_pending_then_approve(self, admin_token):
        # Make a member with enough available to withdraw > auto-approve threshold (1000)
        a_addr, a_pk = new_wallet()
        a_tok = sign_in(a_addr, a_pk)["access_token"]
        requests.post(f"{API}/deposit", json={"amount": 500}, headers=h(a_tok))
        # Build downline so sponsor A gets referrals of >1000 MERQ available
        for _ in range(5):
            x_addr, x_pk = new_wallet()
            x_tok = sign_in(x_addr, x_pk, ref=a_addr)["access_token"]
            requests.post(f"{API}/deposit", json={"amount": 5000}, headers=h(x_tok))
        a_dash = requests.get(f"{API}/member/dashboard", headers=h(a_tok)).json()
        assert a_dash["available"] > 1000, f"available={a_dash['available']}"
        r = requests.post(f"{API}/withdraw/request", json={"amount": 1200}, headers=h(a_tok))
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["status"] == "pending"
        wid = j["request_id"]
        # admin approve
        ap = requests.post(f"{API}/admin/withdrawals/{wid}/action",
                           json={"action": "approve"}, headers=h(admin_token))
        assert ap.status_code == 200, ap.text
        # verify completed
        wl = requests.get(f"{API}/admin/withdrawals?status=completed", headers=h(admin_token)).json()
        assert any(w["id"] == wid for w in wl)

    def test_reject_refunds_available(self, admin_token):
        # Build qualifying member
        a_addr, a_pk = new_wallet()
        a_tok = sign_in(a_addr, a_pk)["access_token"]
        requests.post(f"{API}/deposit", json={"amount": 500}, headers=h(a_tok))
        for _ in range(5):
            x_addr, x_pk = new_wallet()
            x_tok = sign_in(x_addr, x_pk, ref=a_addr)["access_token"]
            requests.post(f"{API}/deposit", json={"amount": 5000}, headers=h(x_tok))
        before = requests.get(f"{API}/member/dashboard", headers=h(a_tok)).json()["available"]
        r = requests.post(f"{API}/withdraw/request", json={"amount": 1100}, headers=h(a_tok))
        assert r.status_code == 200 and r.json()["status"] == "pending"
        wid = r.json()["request_id"]
        # after request, available decreased by 1100
        mid = requests.get(f"{API}/member/dashboard", headers=h(a_tok)).json()["available"]
        assert abs(mid - (before - 1100)) < 0.01
        # reject -> refund
        rj = requests.post(f"{API}/admin/withdrawals/{wid}/action",
                           json={"action": "reject", "reason": "TEST_rejected"}, headers=h(admin_token))
        assert rj.status_code == 200
        after = requests.get(f"{API}/member/dashboard", headers=h(a_tok)).json()["available"]
        assert abs(after - before) < 0.01


# --------------- Earnings: Growth/Commission/Rewards/Autopool ---------------
class TestEarnings:
    def test_growth(self, admin_token):
        r = requests.get(f"{API}/admin/growth", headers=h(admin_token))
        assert r.status_code == 200
        assert "active_positions" in r.json()

    def test_commission(self, admin_token):
        r = requests.get(f"{API}/admin/commission", headers=h(admin_token))
        assert r.status_code == 200
        assert "rate" in r.json()

    def test_rewards_and_version_bump(self, admin_token):
        r = requests.get(f"{API}/admin/rewards", headers=h(admin_token))
        assert r.status_code == 200
        tiers = r.json()["tiers"]
        # bump: save same tiers, should create a new rule_versions entry
        rules_before = requests.get(f"{API}/admin/rules", headers=h(admin_token)).json()
        ver_before = max((v["version"] for v in rules_before["versions"] if v["type"] == "rewards"), default=0)
        s = requests.put(f"{API}/admin/rewards/config", json={"tiers": tiers}, headers=h(admin_token))
        assert s.status_code == 200
        rules_after = requests.get(f"{API}/admin/rules", headers=h(admin_token)).json()
        ver_after = max(v["version"] for v in rules_after["versions"] if v["type"] == "rewards")
        assert ver_after == ver_before + 1

    def test_autopool(self, admin_token):
        r = requests.get(f"{API}/admin/autopool", headers=h(admin_token))
        assert r.status_code == 200
        assert "config" in r.json() and "stats" in r.json()


# --------------- Blockchain (simulated) ---------------
class TestBlockchain:
    def test_token(self, admin_token):
        r = requests.get(f"{API}/admin/token", headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["symbol"] == "MERQ"
        assert r.json()["simulated"] is True

    def test_blockchain(self, admin_token):
        r = requests.get(f"{API}/admin/blockchain", headers=h(admin_token))
        assert r.status_code == 200
        assert "transfers" in r.json()

    def test_treasury(self, admin_token):
        r = requests.get(f"{API}/admin/treasury", headers=h(admin_token))
        assert r.status_code == 200
        assert "alerts" in r.json()
        assert r.json()["simulated"] is True

    def test_liquidity(self, admin_token):
        r = requests.get(f"{API}/admin/liquidity", headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["available"] is False


# --------------- Rules & versioning ---------------
class TestRules:
    def test_rules_get(self, admin_token):
        r = requests.get(f"{API}/admin/rules", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert "current" in j and "versions" in j
        for key in ("referral", "growth", "commission", "autopool", "withdrawal"):
            assert key in j["current"]

    def test_rule_version_create_referral(self, admin_token):
        before = requests.get(f"{API}/admin/rules", headers=h(admin_token)).json()
        v_before = max((v["version"] for v in before["versions"] if v["type"] == "referral"), default=0)
        r = requests.post(f"{API}/admin/rules/version",
                          json={"type": "referral", "params": {"direct_referral_pct": 6}},
                          headers=h(admin_token))
        assert r.status_code == 200, r.text
        assert r.json()["version"] == v_before + 1
        after = requests.get(f"{API}/admin/rules", headers=h(admin_token)).json()
        assert after["current"]["referral"]["direct_referral_pct"] == 6
        # revert
        requests.post(f"{API}/admin/rules/version",
                      json={"type": "referral", "params": {"direct_referral_pct": 5}},
                      headers=h(admin_token))

    def test_rule_withdrawal_revert_defaults(self, admin_token):
        # ensure withdraw_auto_approve_under + cooldown are at expected defaults
        r = requests.post(f"{API}/admin/rules/version",
                          json={"type": "withdrawal",
                                "params": {"min": 10, "max_daily": 5000, "fee_pct": 5,
                                           "protocol_fee_pct": 1, "cooldown_hours": 24,
                                           "auto_approve_under": 1000}},
                          headers=h(admin_token))
        assert r.status_code == 200

    def test_rule_invalid_type(self, admin_token):
        r = requests.post(f"{API}/admin/rules/version",
                          json={"type": "nope", "params": {}}, headers=h(admin_token))
        assert r.status_code == 400


# --------------- Reports (+ CSV) ---------------
class TestReports:
    def test_reports_tables(self, admin_token):
        for rt in ("deposits", "withdrawals", "income", "members"):
            r = requests.get(f"{API}/admin/reports/{rt}", headers=h(admin_token))
            assert r.status_code == 200, f"{rt}: {r.text}"
            j = r.json()
            assert "columns" in j and "rows" in j

    def test_report_csv_export(self, admin_token):
        r = requests.get(f"{API}/admin/reports/deposits/export", headers=h(admin_token))
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert "attachment" in r.headers.get("content-disposition", "")

    def test_report_unknown(self, admin_token):
        r = requests.get(f"{API}/admin/reports/unknown", headers=h(admin_token))
        assert r.status_code == 404


# --------------- Notifications & Support tickets ---------------
class TestNotificationsAndSupport:
    def test_notifications(self, admin_token):
        r = requests.get(f"{API}/admin/notifications", headers=h(admin_token))
        assert r.status_code == 200
        assert "notifications" in r.json()

    def test_tickets_and_update(self, admin_token):
        r = requests.get(f"{API}/admin/tickets", headers=h(admin_token))
        assert r.status_code == 200
        tickets = r.json()
        assert len(tickets) >= 1
        tid = tickets[0]["id"]
        u = requests.put(f"{API}/admin/tickets/{tid}", json={"status": "resolved"}, headers=h(admin_token))
        assert u.status_code == 200


# --------------- Admin Users & Roles ---------------
class TestAdminUsers:
    def test_list_and_create_and_update_and_delete(self, admin_token):
        # roles catalog
        rr = requests.get(f"{API}/admin/roles", headers=h(admin_token))
        assert rr.status_code == 200
        assert "SUPER_ADMIN" in rr.json()["roles"]
        # list
        la = requests.get(f"{API}/admin/admins", headers=h(admin_token))
        assert la.status_code == 200
        # create — a random addr (also authenticates them as member later not required)
        new_addr, _pk = new_wallet()
        c = requests.post(f"{API}/admin/admins",
                         json={"address": new_addr, "name": "TEST_admin",
                               "email": "test@merqon.io", "role": "SUPPORT_ADMIN"},
                         headers=h(admin_token))
        assert c.status_code == 200
        # update role
        u = requests.put(f"{API}/admin/admins/{new_addr}",
                         json={"role": "FINANCE_ADMIN"}, headers=h(admin_token))
        assert u.status_code == 200
        # Cannot change root admin role to non-super
        bad = requests.put(f"{API}/admin/admins/{ADMIN_ADDR}",
                           json={"role": "SUPPORT_ADMIN"}, headers=h(admin_token))
        assert bad.status_code == 400
        # delete new admin
        d = requests.delete(f"{API}/admin/admins/{new_addr}", headers=h(admin_token))
        assert d.status_code == 200
        # cannot delete root
        d2 = requests.delete(f"{API}/admin/admins/{ADMIN_ADDR}", headers=h(admin_token))
        assert d2.status_code == 400

    def test_invalid_role_rejected(self, admin_token):
        addr, _ = new_wallet()
        r = requests.post(f"{API}/admin/admins",
                         json={"address": addr, "name": "x", "role": "NOT_A_ROLE"},
                         headers=h(admin_token))
        assert r.status_code == 400


# --------------- Audit logs ---------------
class TestAudit:
    def test_audit_has_entries(self, admin_token):
        r = requests.get(f"{API}/admin/audit", headers=h(admin_token))
        assert r.status_code == 200
        logs = r.json()
        # earlier tests triggered many admin actions
        assert len(logs) >= 1
        actions = {l["action"] for l in logs}
        # at least one of these actions should appear
        assert actions & {"suspend", "activate", "add_note", "new_rule_version",
                          "update_rewards_config", "withdrawal_approve", "withdrawal_reject"}


# --------------- System health & settings ---------------
class TestSystemHealth:
    def test_health(self, admin_token):
        r = requests.get(f"{API}/admin/health", headers=h(admin_token))
        assert r.status_code == 200
        j = r.json()
        assert j["services"]["mongodb"]["status"] == "online"

    def test_system_get_and_update(self, admin_token):
        r = requests.get(f"{API}/admin/system", headers=h(admin_token))
        assert r.status_code == 200
        orig = r.json()
        upd = requests.put(f"{API}/admin/system",
                           json={"platform_name": "MerqON", "maintenance_mode": False,
                                 "block_confirmations": 12},
                           headers=h(admin_token))
        assert upd.status_code == 200
        _ = orig


# --------------- Emergency center ---------------
class TestEmergency:
    def test_emergency_toggle_requires_reason(self, admin_token):
        r = requests.post(f"{API}/admin/emergency",
                          json={"control": "pause_deposits", "enabled": True, "reason": ""},
                          headers=h(admin_token))
        assert r.status_code == 400

    def test_emergency_invalid_control(self, admin_token):
        r = requests.post(f"{API}/admin/emergency",
                          json={"control": "nuke", "enabled": True, "reason": "TEST"},
                          headers=h(admin_token))
        assert r.status_code == 400

    def test_pause_deposits_blocks_member(self, admin_token):
        # Enable
        r = requests.post(f"{API}/admin/emergency",
                          json={"control": "pause_deposits", "enabled": True, "reason": "TEST_pause"},
                          headers=h(admin_token))
        assert r.status_code == 200
        try:
            addr, pk = new_wallet()
            tok = sign_in(addr, pk)["access_token"]
            dr = requests.post(f"{API}/deposit", json={"amount": 100}, headers=h(tok))
            assert dr.status_code == 400
            assert "paused" in dr.text.lower() or "pause" in dr.text.lower()
        finally:
            # Toggle OFF
            off = requests.post(f"{API}/admin/emergency",
                                json={"control": "pause_deposits", "enabled": False, "reason": "TEST_unpause"},
                                headers=h(admin_token))
            assert off.status_code == 200

    def test_pause_withdrawals_blocks_member(self, admin_token):
        on = requests.post(f"{API}/admin/emergency",
                           json={"control": "pause_withdrawals", "enabled": True, "reason": "TEST_pw"},
                           headers=h(admin_token))
        assert on.status_code == 200
        try:
            addr, pk = new_wallet()
            tok = sign_in(addr, pk)["access_token"]
            # need active status
            requests.post(f"{API}/deposit", json={"amount": 100}, headers=h(tok))
            requests.post(f"{API}/rewards/claim", json={"key": "first_activity"}, headers=h(tok))
            dr = requests.post(f"{API}/withdraw/request", json={"amount": 15}, headers=h(tok))
            assert dr.status_code == 400
        finally:
            requests.post(f"{API}/admin/emergency",
                          json={"control": "pause_withdrawals", "enabled": False, "reason": "TEST_pw_off"},
                          headers=h(admin_token))

    def test_disable_registration_blocks_new_signup(self, admin_token):
        on = requests.post(f"{API}/admin/emergency",
                           json={"control": "disable_registration", "enabled": True, "reason": "TEST_dr"},
                           headers=h(admin_token))
        assert on.status_code == 200
        try:
            addr, pk = new_wallet()
            # nonce still works
            n = requests.post(f"{API}/auth/nonce", json={"address": addr}).json()
            sig = Account.sign_message(encode_defunct(text=n["message"]), private_key=pk).signature.hex()
            if not sig.startswith("0x"):
                sig = "0x" + sig
            r = requests.post(f"{API}/auth/verify",
                              json={"address": addr, "nonce": n["nonce"], "signature": sig})
            assert r.status_code == 403
        finally:
            requests.post(f"{API}/admin/emergency",
                          json={"control": "disable_registration", "enabled": False, "reason": "TEST_dr_off"},
                          headers=h(admin_token))
