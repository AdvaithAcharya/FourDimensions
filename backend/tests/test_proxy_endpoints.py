import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_chat_completions_untagged_defaults_to_unattributed():
    """Requirement 1: Untagged request -> team == 'Unattributed'."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": "Hello world"}]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["attribution"]["team"] == "Unattributed"
        assert data["attribution"]["feature"] == "Unattributed"
        assert data["attribution"]["user"] == "Unattributed"

@pytest.mark.asyncio
async def test_anthropic_messages_endpoint_format():
    """Requirement 8: POST /v1/messages returns Anthropic format with usage and attribution."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/v1/messages",
            json={
                "model": "claude-3-5-sonnet",
                "messages": [{"role": "user", "content": "Explain FinOps attribution"}],
                "metadata": {
                    "team": "Data-Science",
                    "feature": "Research-Advisor",
                    "user_id": "dr_smith"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "message"
        assert data["role"] == "assistant"
        assert "usage" in data
        assert "input_tokens" in data["usage"]
        assert "output_tokens" in data["usage"]
        assert data["usage"]["input_tokens"] > 0
        assert data["attribution"]["team"] == "Data-Science"
        assert data["attribution"]["feature"] == "Research-Advisor"
        assert data["attribution"]["status"] == "complete"
