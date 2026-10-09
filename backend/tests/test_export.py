import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_export_statistics_as_csv_full():
    """Requirement: Export data statistics in CSV format (full executive statement)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/finops/export?format=csv&type=full&currency=USD")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        assert "attachment; filename=krypton_finops_statistics_" in resp.headers["content-disposition"]
        text = resp.text
        assert "KRYPTON LLM FINOPS EXECUTIVE DATA STATISTICS" in text
        assert "--- 1. EXECUTIVE KPI SUMMARY ---" in text
        assert "--- 2. DEPARTMENT / TEAM BREAKDOWN ---" in text

@pytest.mark.asyncio
async def test_export_statistics_as_csv_ledger():
    """Requirement: Export request ledger records in flat tabular CSV format."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/finops/export?format=csv&type=ledger&currency=USD")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers["content-type"]
        text = resp.text
        assert "Request ID,Timestamp,Team,Feature,User ID" in text

@pytest.mark.asyncio
async def test_export_statistics_as_json():
    """Requirement: Export data statistics in structured JSON format with 4D breakdowns."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/finops/export?format=json&currency=USD")
        assert resp.status_code == 200
        assert "application/json" in resp.headers["content-type"]
        data = resp.json()
        assert "executive_summary" in data
        assert "dimension_breakdowns" in data
        assert "by_team" in data["dimension_breakdowns"]
        assert "by_feature" in data["dimension_breakdowns"]
        assert "by_model" in data["dimension_breakdowns"]
        assert "by_time_period" in data["dimension_breakdowns"]
        assert "ledger_records" in data
