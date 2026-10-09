import os
import json
from decimal import Decimal
import pytest
from backend.pricing import PricingEngine, pricing_engine

def test_longest_matching_key_prefers_gpt_4o_mini():
    """Requirement 3: Matching must prefer longest key (gpt-4o-mini-2024-07-18 -> gpt-4o-mini)."""
    in_rate, out_rate, matched_key, cost_status = pricing_engine.get_model_rates("gpt-4o-mini-2024-07-18")
    assert matched_key == "gpt-4o-mini"
    assert cost_status == "priced"
    assert in_rate == Decimal("0.15")
    assert out_rate == Decimal("0.60")

def test_longest_matching_key_gpt_4o_standard():
    """Exact gpt-4o matches gpt-4o rates."""
    in_rate, out_rate, matched_key, cost_status = pricing_engine.get_model_rates("gpt-4o")
    assert matched_key == "gpt-4o"
    assert cost_status == "priced"
    assert in_rate == Decimal("2.50")
    assert out_rate == Decimal("10.00")

def test_unknown_model_priced_at_zero_and_marked_unpriced():
    """Requirement 3: Unknown models do NOT fallback to gpt-4o. Price at 0 and mark unpriced_model."""
    res = pricing_engine.calculate_cost("unknown-provider-xyz-99", 5000, 2000)
    assert res.total_cost == Decimal(0)
    assert res.cost_status == "unpriced_model"
    assert res.matched_model == "unknown-provider-xyz-99"

def test_pricing_calculation_exact_decimal():
    """Accurate cost calculation without floating point drift."""
    # gpt-4o: 1000 in ($2.50/1M = 0.0025), 500 out ($10.00/1M = 0.0050) -> 0.0075
    res = pricing_engine.calculate_cost("gpt-4o", 1000, 500)
    assert res.input_cost == Decimal("0.00250000")
    assert res.output_cost == Decimal("0.00500000")
    assert res.total_cost == Decimal("0.00750000")
    assert res.cost_status == "priced"

def test_load_custom_pricing_file(tmp_path):
    """Requirement 3: Load pricing from supplied JSON/CSV file with per-1k and per-1m units."""
    custom_data = {
        "organizer-model-a": {
            "input_cost_per_1k": "0.002",
            "output_cost_per_1k": "0.004",
            "unit": "1k"
        },
        "organizer-model-b": {
            "input_cost_per_1m": "1.50",
            "output_cost_per_1m": "3.00",
            "unit": "1m"
        }
    }
    p_file = tmp_path / "custom_pricing.json"
    p_file.write_text(json.dumps(custom_data), encoding="utf-8")

    engine = PricingEngine(pricing_file=str(p_file))
    # organizer-model-a: 0.002 per 1k = 2.00 per 1M. For 1000 tokens: 1000 * 2.00 / 1M = 0.00200000
    res_a = engine.calculate_cost("organizer-model-a", 1000, 500)
    assert res_a.input_cost == Decimal("0.00200000")
    assert res_a.output_cost == Decimal("0.00200000")
    assert res_a.total_cost == Decimal("0.00400000")
    assert res_a.cost_status == "priced"
