import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_admin_login_success_with_valid_credentials():
    """Security Requirement: user: admin, pass: admin123 grants administrative access."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert data["authenticated"] is True
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "Super Admin"
        assert "token" in data
        assert data["token"].startswith("krypton_sec_")

@pytest.mark.asyncio
async def test_admin_login_fails_with_invalid_credentials():
    """Security Requirement: Bad credentials return 401 and deny access."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/auth/login", json={"username": "admin", "password": "wrong_password"})
        assert resp.status_code == 401

        resp2 = await ac.post("/api/auth/login", json={"username": "intruder", "password": "admin123"})
        assert resp2.status_code == 401

@pytest.mark.asyncio
async def test_auth_verify_and_logout_lifecycle():
    """Security Requirement: Verifies session token and logout lifecycle."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login
        login_resp = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login_resp.json()["token"]

        # Verify
        verify_resp = await ac.get(f"/api/auth/verify?token={token}")
        assert verify_resp.status_code == 200
        assert verify_resp.json()["authenticated"] is True

        # Logout
        logout_resp = await ac.post(f"/api/auth/logout?token={token}")
        assert logout_resp.status_code == 200
