import pytest
from decimal import Decimal
from backend.validator import FinOpsValidator
from backend.db import in_memory_logs, clear_all_data

@pytest.mark.asyncio
async def test_validator_fails_when_wrong_value_supplied():
    """Requirement 4: Put a wrong value in the ledger / expected values -> validation reports MISMATCH."""
    # Feed an impossible expected cost ($999.00)
    fake_expected = {
        "grand_total_cost": 999.00,
        "total_requests": 5
    }
    report = await FinOpsValidator.validate_against_expected(fake_expected)
    assert report["status"] == "SUCCESS"
    assert "FAILED" in report["reconciliation_verdict"] or "MISMATCH" in report["reconciliation_verdict"]
    assert report["discrepancy_rate_pct"] > 0
    # There should be at least one MISMATCH check
    assert any(c["status"] == "MISMATCH" for c in report["checks"])

@pytest.mark.asyncio
async def test_validator_returns_no_checks_when_no_recognized_keys():
    """Requirement 4: If expected file has no recognised keys, return status 'NO_CHECKS', never MATCH."""
    unrecognized = {
        "random_nonsense_key_1": "abc",
        "unrelated_field": 12345
    }
    report = await FinOpsValidator.validate_against_expected(unrecognized)
    assert report["status"] == "NO_CHECKS"
    assert report["reconciliation_verdict"] == "NO_CHECKS"
    assert len(report["checks"]) == 0

@pytest.mark.asyncio
async def test_validator_passes_when_actual_values_match_ledger():
    """Requirement 4: When expected matches actual aggregated ledger totals, reports PASSED."""
    await clear_all_data()
    # Add a mock record
    in_memory_logs.append({
        "id": "test_req_1",
        "team": "Engineering",
        "feature": "CodeReview",
        "model": "gpt-4o",
        "prompt_tokens": 1000,
        "completion_tokens": 500,
        "total_tokens": 1500,
        "total_cost_usd": 0.0075,
        "latency_ms": 15.0
    })

    expected = {
        "grand_total_cost": 0.0075,
        "total_requests": 1,
        "total_tokens": 1500,
        "by_team": {
            "Engineering": 0.0075
        }
    }
    report = await FinOpsValidator.validate_against_expected(expected)
    assert report["status"] == "SUCCESS"
    assert "PASSED" in report["reconciliation_verdict"]
    assert report["discrepancy_rate_pct"] == 0.0
    assert all(c["status"] == "MATCH" for c in report["checks"])
