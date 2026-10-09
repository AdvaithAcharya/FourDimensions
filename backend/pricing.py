import os
import csv
import json
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Tuple, Optional, List
from backend.config import settings

logger = logging.getLogger("krypton.pricing")

ONE_MILLION = Decimal("1000000")
ONE_THOUSAND = Decimal("1000")
QUANTIZE_EXP = Decimal("0.00000001")  # 8 decimal places precision for micro-cent accounting

class CostResult(tuple):
    """
    Cost calculation result tuple supporting 5-element unpacking:
    (input_cost, output_cost, total_cost, matched_model, cost_status)
    and named attribute access.
    """
    def __new__(cls, in_c: Decimal, out_c: Decimal, tot_c: Decimal, model: str, cost_status: str = "priced"):
        return super().__new__(cls, (in_c, out_c, tot_c, model, cost_status))

    def __init__(self, in_c: Decimal, out_c: Decimal, tot_c: Decimal, model: str, cost_status: str = "priced"):
        self.input_cost = in_c
        self.output_cost = out_c
        self.total_cost = tot_c
        self.matched_model = model
        self.cost_status = cost_status

class PricingEngine:
    """
    Configurable High-Precision Decimal Accounting Engine for LLM FinOps.
    
    Guarantees:
    - Loads external pricing catalog from PRICING_FILE (JSON or CSV).
    - Supports per-1K and per-1M token rate units.
    - Model Matching: prefers LONGEST matching key (e.g. 'gpt-4o-mini-2024-07-18' -> 'gpt-4o-mini').
    - Unknown Models: Prices at 0, marks cost_status='unpriced_model' (Never falls back to gpt-4o).
    - Zero Floating Point Drift: Decimal with ROUND_HALF_UP.
    """
    def __init__(self, pricing_file: Optional[str] = None):
        self.pricing_table: Dict[str, Dict[str, Decimal]] = {}
        self.pricing_file = pricing_file or getattr(settings, "PRICING_FILE", "backend/data/pricing.json")
        self.load_from_file(self.pricing_file)

    def load_from_file(self, filepath: str) -> None:
        """Loads and normalizes pricing table from a JSON or CSV file."""
        if not os.path.exists(filepath):
            # Check relative to repo root
            alt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filepath)
            if os.path.exists(alt_path):
                filepath = alt_path
            else:
                logger.warning(f"Pricing file '{filepath}' not found. Initializing empty catalog.")
                self.pricing_table = {}
                return

        table: Dict[str, Dict[str, Decimal]] = {}
        try:
            if filepath.endswith(".csv"):
                with open(filepath, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        model = (row.get("model") or row.get("model_id") or "").strip().lower()
                        if not model:
                            continue
                        unit = (row.get("unit") or "1m").strip().lower()
                        in_rate = Decimal(str(row.get("input_cost") or row.get("input_cost_per_1m") or row.get("input_cost_per_1k") or 0))
                        out_rate = Decimal(str(row.get("output_cost") or row.get("output_cost_per_1m") or row.get("output_cost_per_1k") or 0))
                        if unit == "1k" or "per_1k" in row:
                            in_rate = in_rate * ONE_THOUSAND
                            out_rate = out_rate * ONE_THOUSAND
                        table[model] = {"input_rate": in_rate, "output_rate": out_rate}
            else:
                with open(filepath, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    for model_id, rates in raw.items():
                        model = model_id.strip().lower()
                        unit = str(rates.get("unit") or "1m").strip().lower()
                        in_val = rates.get("input_cost_per_1m") or rates.get("input_cost_per_1k") or rates.get("input_rate") or 0
                        out_val = rates.get("output_cost_per_1m") or rates.get("output_cost_per_1k") or rates.get("output_rate") or 0
                        in_rate = Decimal(str(in_val))
                        out_rate = Decimal(str(out_val))
                        if unit == "1k" or "input_cost_per_1k" in rates:
                            in_rate = in_rate * ONE_THOUSAND
                            out_rate = out_rate * ONE_THOUSAND
                        table[model] = {"input_rate": in_rate, "output_rate": out_rate}

            self.pricing_table = table
            logger.info(f"Loaded {len(table)} model pricing entries from '{filepath}'.")
        except Exception as e:
            logger.error(f"Error loading pricing catalog from '{filepath}': {e}")

    def get_model_rates(self, model_name: str) -> Tuple[Decimal, Decimal, str, str]:
        """
        Matches model using longest matching key.
        Returns: (input_rate_per_1m, output_rate_per_1m, matched_key, cost_status)
        If unknown: returns (0, 0, model_name, "unpriced_model").
        """
        clean = (model_name or "").lower().strip()
        if not clean:
            return Decimal(0), Decimal(0), "unknown", "unpriced_model"

        # 1. Exact direct match
        if clean in self.pricing_table:
            rates = self.pricing_table[clean]
            return rates["input_rate"], rates["output_rate"], clean, "priced"

        # 2. Heuristic match sorted by LONGEST KEY FIRST
        # E.g. 'gpt-4o-mini' (len 11) is tested before 'gpt-4o' (len 6)
        sorted_keys = sorted(self.pricing_table.keys(), key=lambda k: len(k), reverse=True)
        for key in sorted_keys:
            if key in clean or clean in key:
                rates = self.pricing_table[key]
                return rates["input_rate"], rates["output_rate"], key, "priced"

        # 3. Unknown model -> DO NOT fallback to gpt-4o. Price at 0 and flag as unpriced.
        return Decimal(0), Decimal(0), clean, "unpriced_model"

    def calculate_cost(
        self,
        model_name: str,
        input_tokens: int,
        output_tokens: int
    ) -> CostResult:
        """
        Calculates exact costs.
        Returns CostResult: (input_cost, output_cost, total_cost, matched_model, cost_status)
        """
        in_rate, out_rate, matched_model, cost_status = self.get_model_rates(model_name)

        if cost_status == "unpriced_model":
            return CostResult(Decimal(0), Decimal(0), Decimal(0), matched_model, "unpriced_model")

        d_input_tokens = Decimal(input_tokens)
        d_output_tokens = Decimal(output_tokens)

        input_cost = ((d_input_tokens / ONE_MILLION) * in_rate).quantize(QUANTIZE_EXP, rounding=ROUND_HALF_UP)
        output_cost = ((d_output_tokens / ONE_MILLION) * out_rate).quantize(QUANTIZE_EXP, rounding=ROUND_HALF_UP)
        total_cost = (input_cost + output_cost).quantize(QUANTIZE_EXP, rounding=ROUND_HALF_UP)

        return CostResult(input_cost, output_cost, total_cost, matched_model, "priced")

    def get_raw_table(self) -> Dict[str, Any]:
        result = {}
        for model, rates in self.pricing_table.items():
            result[model] = {
                "input_cost_per_1m_usd": float(rates["input_rate"]),
                "output_cost_per_1m_usd": float(rates["output_rate"]),
                "input_cost_per_1k_usd": float(rates["input_rate"] / ONE_THOUSAND),
                "output_cost_per_1k_usd": float(rates["output_rate"] / ONE_THOUSAND),
            }
        return result

pricing_engine = PricingEngine()
