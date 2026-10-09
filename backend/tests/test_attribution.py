import pytest
from backend.main import extract_attribution

def test_untagged_request_defaults_to_unattributed():
    """Requirement 1: Untagged requests must NOT default to Engineering/General/corp_user_01."""
    team, feature, user_id, env, status = extract_attribution({})
    assert team == "Unattributed"
    assert feature == "Unattributed"
    assert user_id == "Unattributed"
    assert status == "unattributed"

def test_partial_attribution_with_only_team():
    """Requirement 1: Partial tags mark status as partial."""
    team, feature, user_id, env, status = extract_attribution(
        {"team": "Data-Science"}
    )
    assert team == "Data-Science"
    assert feature == "Unattributed"
    assert user_id == "Unattributed"
    assert status == "partial"

def test_complete_attribution_across_all_three_dimensions():
    """Requirement 1: Complete tags mark status as complete."""
    team, feature, user_id, env, status = extract_attribution({
        "team": "Engineering",
        "feature": "CodeReview-Bot",
        "user_id": "dev_42",
        "environment": "staging"
    })
    assert team == "Engineering"
    assert feature == "CodeReview-Bot"
    assert user_id == "dev_42"
    assert env == "staging"
    assert status == "complete"

def test_nested_metadata_attribution():
    """Requirement 1 & 2: Attribution extracted from nested metadata or attribution dict."""
    team, feature, user_id, env, status = extract_attribution({
        "metadata": {
            "team": "Security-Operations",
            "feature": "Vulnerability-Scan",
            "user": "sec_auditor"
        }
    })
    assert team == "Security-Operations"
    assert feature == "Vulnerability-Scan"
    assert user_id == "sec_auditor"
    assert status == "complete"

def test_header_fallback():
    """Headers used when body has no attribution tags."""
    team, feature, user_id, env, status = extract_attribution(
        {},
        x_team="Product-Design",
        x_feature="Wireframe-Gen",
        x_user_id="designer_01"
    )
    assert team == "Product-Design"
    assert feature == "Wireframe-Gen"
    assert user_id == "designer_01"
    assert status == "complete"
