from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Tuple, Optional
import logging

logger = logging.getLogger("krypton.pricing")

# Default Enterprise Pricing Table (Rates per 1,000,000 Tokens)
# All rates are specified as Decimal strings to eliminate floating-point representation drift.
DEFAULT_PRICING_TABLE: Dict[str, Dict[str, str]] = {
    "gpt-4o": {
        "input_cost_per_1m": "2.50",
        "output_cost_per_1m": "10.00",
        "description": "OpenAI Flagship Multimodal"
    },
    "gpt-4o-mini": {
        "input_cost_per_1m": "0.15",
        "output_cost_per_1m": "0.60",
        "description": "OpenAI High-Speed Lightweight"
    },
    "claude-3-5-sonnet": {
        "input_cost_per_1m": "3.00",
        "output_cost_per_1m": "15.00",
        "description": "Anthropic Frontier Reasoning"
    },
    "gemini-1.5-flash": {
        "input_cost_per_1m": "0.075",
        "output_cost_per_1m": "0.30",
        "description": "Google High-Volume Efficiency"
    },
    "gemini-1.5-pro": {
        "input_cost_per_1m": "1.25",
        "output_cost_per_1m": "5.00",
        "description": "Google Deep Context & Reasoning"
    },
    "llama-3-70b": {
        "input_cost_per_1m": "0.80",
        "output_cost_per_1m": "0.80",
        "description": "Meta Open Weights Hosted"
    }
}

ONE_MILLION = Decimal("1000000")
QUANTIZE_EXP = Decimal("0.00000001")  # 8 decimal places precision for micro-cent accounting

class PricingEngine:
    """
    High-Precision Decimal Accounting Engine for LLM FinOps.
    
    Guarantees:
    - Time Complexity: O(1) dictionary key lookup and constant-time fixed-point arithmetic.
    - Space Complexity: O(1) memory footprint per evaluation.
    - Zero Floating Point Drift: Uses Python Decimal with ROUND_HALF_UP.
    """
    def __init__(self, pricing_table: Optional[Dict[str, Dict[str, str]]] = None):
        self.pricing_table: Dict[str, Dict[str, Decimal]] = {}
        source = pricing_table or DEFAULT_PRICING_TABLE
        self.load_pricing_table(source)

    def load_pricing_table(self, source: Dict[str, Dict[str, str]]) -> None:
        table: Dict[str, Dict[str, Decimal]] = {}
        for model_id, rates in source.items():
            normalized = model_id.lower().strip()
            table[normalized] = {
                "input_rate": Decimal(str(rates.get("input_cost_per_1m", "2.50"))),
                "output_rate": Decimal(str(rates.get("output_cost_per_1m", "10.00"))),
            }
        self.pricing_table = table

    def get_model_rates(self, model_name: str) -> Tuple[Decimal, Decimal, str]:
        """Returns (input_rate_per_1m, output_rate_per_1m, matched_model_key)."""
        clean = (model_name or "").lower().strip()
        # Direct match
        if clean in self.pricing_table:
            return self.pricing_table[clean]["input_rate"], self.pricing_table[clean]["output_rate"], clean

        # Substring heuristic match
        for key, rates in self.pricing_table.items():
            if key in clean or clean in key:
                return rates["input_rate"], rates["output_rate"], key

        # Fallback to gpt-4o standard rate
        default_rates = self.pricing_table.get("gpt-4o", {
            "input_rate": Decimal("2.50"),
            "output_rate": Decimal("10.00")
        })
        return default_rates["input_rate"], default_rates["output_rate"], "gpt-4o"

    def calculate_cost(
        self,
        model_name: str,
        input_tokens: int,
        output_tokens: int
    ) -> Tuple[Decimal, Decimal, Decimal, str]:
        """
        Calculates exact costs: (input_cost, output_cost, total_cost, matched_model).
        Formulas:
            Input Cost = (Input Tokens / 1,000,000) * Input Rate
            Output Cost = (Output Tokens / 1,000,000) * Output Rate
            Total Cost = Input Cost + Output Cost
        All calculations quantized to 8 decimal places.
        """
        in_rate, out_rate, matched_model = self.get_model_rates(model_name)
        
        d_input_tokens = Decimal(input_tokens)
        d_output_tokens = Decimal(output_tokens)
        
        input_cost = ((d_input_tokens / ONE_MILLION) * in_rate).quantize(QUANTIZE_EXP, rounding=ROUND_HALF_UP)
        output_cost = ((d_output_tokens / ONE_MILLION) * out_rate).quantize(QUANTIZE_EXP, rounding=ROUND_HALF_UP)
        total_cost = (input_cost + output_cost).quantize(QUANTIZE_EXP, rounding=ROUND_HALF_UP)
        
        return input_cost, output_cost, total_cost, matched_model

    def get_raw_table(self) -> Dict[str, Any]:
        result = {}
        for model, rates in self.pricing_table.items():
            result[model] = {
                "input_cost_per_1m_usd": float(rates["input_rate"]),
                "output_cost_per_1m_usd": float(rates["output_rate"]),
                "input_cost_per_1k_usd": float(rates["input_rate"] / Decimal("1000")),
                "output_cost_per_1k_usd": float(rates["output_rate"] / Decimal("1000")),
            }
        return result

pricing_engine = PricingEngine()
