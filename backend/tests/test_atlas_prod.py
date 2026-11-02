"""Atlas (EXTERNAL_MONGO_URL) production DB checks: signup lands in Atlas, sponsor rule, admin wallets/rules/network.
Creates temp admin + temp member; full diff-based cleanup restores Atlas to its pre-test state."""
import os, json, requests, pytest
from eth_account import Account
from eth_account.messages import encode_defunct
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
BASE_URL = open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split()[0].strip().rstrip("/")
API = BASE_URL + "/api"
ROOT = "0x625a2351446c78b664236747899ba49561a35944"
OWNER = "0xc1aca21abdfdbf0730e73b56fe949cd2703e63ad"
atlas = MongoClient(os.environ["EXTERNAL_MONGO_URL"])[os.environ["EXTERNAL_DB_NAME"]]
local = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
STATE = {}


def login(acct, ref=None):
    n = requests.post(f"{API}/auth/nonce", json={"address": acct.address}).json()
    sig = acct.sign_message(encode_defunct(text=n["message"])).signature.hex()
    body = {"address": acct.address, "nonce": n["nonce"], "signature": "0x" + sig.removeprefix("0x")}
    if ref:
        body["ref"] = ref
    return requests.post(f"{API}/auth/verify", json=body)


@pytest.fixture(scope="module", autouse=True)
def atlas_guard():
    # snapshot every _id in every collection + exact root/owner/settings docs
    before_cols = set(atlas.list_collection_names())
    before_ids = {c: set(x["_id"] for x in atlas[c].find({}, {"_id": 1})) for c in before_cols}
    root_doc = atlas.members.find_one({"_id": ROOT})
    owner_doc = atlas.admin_users.find_one({"_id": OWNER})
    settings_doc = atlas.settings.find_one({"_id": "global"})
    admin = Account.create()
    a = admin.address.lower()
    atlas.admin_users.insert_one({"_id": a, "address": admin.address, "role": "SUPER_ADMIN", "status": "active", "name": "tmp-test"})
    atlas.settings.update_one({"_id": "global"}, {"$addToSet": {"admin_addresses": a}})
    STATE["admin"] = admin
    r = login(admin)
    STATE["admin_jwt"] = r.json().get("access_token")
    yield
    # cleanup: delete any doc not present before; drop newly created collections; restore key docs
    for c in atlas.list_collection_names():
        if c not in before_cols:
            atlas[c].drop(); continue
        new = [x["_id"] for x in atlas[c].find({}, {"_id": 1}) if x["_id"] not in before_ids[c]]
        if new:
            atlas[c].delete_many({"_id": {"$in": new}})
    atlas.members.replace_one({"_id": ROOT}, root_doc)
    atlas.admin_users.replace_one({"_id": OWNER}, owner_doc)
    atlas.settings.update_one({"_id": "global"}, {"$set": {"admin_addresses": settings_doc["admin_addresses"]}})


def H():
    return {"Authorization": f"Bearer {STATE['admin_jwt']}"}


class TestAtlasSignup:
    def test_signup_without_ref_rejected(self):
        acct = Account.create()
        r = login(acct)
        assert r.status_code == 400
        assert "sponsor" in r.text.lower()
        assert atlas.members.find_one({"_id": acct.address.lower()}) is None

    def test_signup_with_ref_lands_in_atlas(self):
        acct = Account.create()
        STATE["member"] = acct
        r = login(acct, ref="0x625A2351446c78b664236747899Ba49561a35944")
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["is_new"] is True and j["access_token"]
        STATE["member_jwt"] = j["access_token"]
        doc = atlas.members.find_one({"_id": acct.address.lower()})
        assert doc is not None and doc["sponsor"] == ROOT
        assert local.members.find_one({"_id": acct.address.lower()}) is None
        root = atlas.members.find_one({"_id": ROOT})
        assert root["direct_count"] >= 1

    def test_ports_status_member(self):
        r = requests.get(f"{API}/ports/status", headers={"Authorization": f"Bearer {STATE['member_jwt']}"})
        assert r.status_code == 200, r.text
        print(json.dumps(r.json())[:400])

    def test_member_profile_sponsor(self):
        r = requests.get(f"{API}/member/profile", headers={"Authorization": f"Bearer {STATE['member_jwt']}"})
        assert r.status_code == 200
        assert r.json().get("sponsor", "").lower() == ROOT


class TestAtlasAdmin:
    def test_admin_jwt(self):
        assert STATE["admin_jwt"]

    def test_wallets(self):
        r = requests.get(f"{API}/admin/wallets", headers=H())
        assert r.status_code == 200, r.text
        w = r.json()
        print(json.dumps({"ports": w["ports"], "merq": w["swap"].get("merq_token_address"), "tp": w["techpass_receive_wallet"]}))
        assert w["ports"]["entry"]["receive_wallet"].lower() == "0xbb8753e111bb720b32df6ba404cc6c090d103093"
        assert w["ports"]["unity"]["receive_wallet"].lower() == "0x80b2aee4083fdbfa192e484eac9c97f8fc77d500"
        assert w["swap"]["merq_token_address"].lower() == "0x0be2f6736e8f9188a774aa953888dedb883986e6"

    def test_port_income_rules(self):
        r = requests.get(f"{API}/admin/port-income-rules", headers=H())
        assert r.status_code == 200, r.text
        assert r.json()["rules"]

    def test_income_rules(self):
        r = requests.get(f"{API}/admin/income-rules", headers=H())
        assert r.status_code == 200, r.text

    def test_network_default_root(self):
        r = requests.get(f"{API}/admin/network", headers=H())
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["root"] == ROOT
        assert j["summary"]["direct"] >= 1
        print(json.dumps(j)[:600])

    def test_members_list(self):
        r = requests.get(f"{API}/admin/members", headers=H())
        assert r.status_code == 200, r.text
        print(json.dumps(r.json())[:600])

    def test_dashboard(self):
        r = requests.get(f"{API}/admin/dashboard", headers=H())
        assert r.status_code == 200, r.text
        print(json.dumps(r.json())[:600])
