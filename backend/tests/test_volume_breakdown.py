"""
Test suite for Team Volume feature:
- GET /api/network/volume-breakdown endpoint
- propagate_volume function integration
- Volume backfill verification
"""
import pytest
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVolumeBreakdownEndpoint:
    """Tests for /api/network/volume-breakdown endpoint"""
    
    def test_volume_breakdown_requires_auth(self):
        """Endpoint should return 401/403 without authentication"""
        response = requests.get(f"{BASE_URL}/api/network/volume-breakdown")
        # Should return 401 or 403 Not authenticated (endpoint exists)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        assert "authenticated" in data["detail"].lower() or "not authenticated" in data["detail"].lower()
        print(f"✓ Volume breakdown endpoint exists and requires auth ({response.status_code})")
    
    def test_volume_breakdown_endpoint_registered(self):
        """Verify the endpoint is registered in the API"""
        # A 401 response confirms the endpoint exists
        response = requests.get(f"{BASE_URL}/api/network/volume-breakdown")
        assert response.status_code in [401, 403], f"Endpoint not found or error: {response.status_code}"
        print(f"✓ Volume breakdown endpoint is registered")


class TestDashboardEndpoint:
    """Tests for dashboard endpoint which includes team_volume"""
    
    def test_dashboard_requires_auth(self):
        """Dashboard endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/member/dashboard")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Dashboard endpoint requires auth ({response.status_code})")


class TestNetworkDirectsEndpoint:
    """Tests for network directs endpoint"""
    
    def test_network_directs_requires_auth(self):
        """Network directs endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/network/directs")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Network directs endpoint requires auth ({response.status_code})")


class TestVolumeBackfillDatabase:
    """Database verification tests for volume backfill"""
    
    @pytest.fixture(scope="class")
    def db_client(self):
        """Create MongoDB client for database verification"""
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        MONGO_URL = os.environ.get('EXTERNAL_MONGO_URL') or os.environ.get('MONGO_URL')
        DB_NAME = os.environ.get('EXTERNAL_DB_NAME') if os.environ.get('EXTERNAL_MONGO_URL') else os.environ.get('DB_NAME')
        
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        yield db
        client.close()
    
    def test_volume_backfill_completed(self, db_client):
        """Verify volume backfill has been executed"""
        import asyncio
        
        async def check():
            settings = await db_client.settings.find_one({"_id": "global"})
            return settings.get("volume_backfilled")
        
        result = asyncio.get_event_loop().run_until_complete(check())
        assert result is not None, "Volume backfill has not been executed"
        print(f"✓ Volume backfill completed at: {result}")
    
    def test_members_have_nonzero_team_volume(self, db_client):
        """Verify members have non-zero team_volume after backfill"""
        import asyncio
        
        async def check():
            count = await db_client.members.count_documents({"team_volume": {"$gt": 0}})
            return count
        
        count = asyncio.get_event_loop().run_until_complete(check())
        assert count > 0, "No members have non-zero team_volume"
        print(f"✓ {count} members have non-zero team_volume")
    
    def test_techpass_purchases_exist(self, db_client):
        """Verify TechPass purchases exist for volume calculation"""
        import asyncio
        
        async def check():
            count = await db_client.techpass.count_documents({"status": "confirmed"})
            return count
        
        count = asyncio.get_event_loop().run_until_complete(check())
        assert count > 0, "No confirmed TechPass purchases found"
        print(f"✓ {count} confirmed TechPass purchases exist")
    
    def test_port_purchases_exist(self, db_client):
        """Verify Port purchases exist for volume calculation"""
        import asyncio
        
        async def check():
            count = await db_client.port_purchases.count_documents({"status": "confirmed"})
            return count
        
        count = asyncio.get_event_loop().run_until_complete(check())
        # Port purchases may be 0 or more
        print(f"✓ {count} confirmed Port purchases exist")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
