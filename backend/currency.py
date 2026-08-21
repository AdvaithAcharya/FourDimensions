import time
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger("krypton.currency")

class MultiCurrencyService:
    def __init__(self):
        self.base_currency = "USD"
        # Initial standard conversion rates relative to USD
        self.rates: Dict[str, float] = {
            "USD": 1.00,
            "INR": 83.50,
            "EUR": 0.92,
            "GBP": 0.79,
            "JPY": 155.20,
            "CAD": 1.36,
            "AUD": 1.51
        }
        self.currency_symbols: Dict[str, str] = {
            "USD": "$",
            "INR": "₹",
            "EUR": "€",
            "GBP": "£",
            "JPY": "¥",
            "CAD": "CA$",
            "AUD": "A$"
        }
        self.last_updated: float = time.time()
        
    async def refresh_rates(self):
        """Fetch live exchange rates from public API or ECB feed."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get("https://open.er-api.com/v6/latest/USD")
                if res.status_code == 200:
                    data = res.json()
                    live_rates = data.get("rates", {})
                    for curr in self.rates.keys():
                        if curr in live_rates:
                            self.rates[curr] = float(live_rates[curr])
                    self.last_updated = time.time()
                    logger.info("Successfully updated multi-currency exchange rates.")
        except Exception as e:
            logger.warning(f"Could not refresh live exchange rates ({e}). Using cached default rates.")

    def convert_from_usd(self, amount_usd: float, target_currency: str = "USD") -> float:
        rate = self.rates.get(target_currency.upper(), 1.0)
        return round(amount_usd * rate, 4)

    def convert_to_usd(self, amount: float, source_currency: str = "USD") -> float:
        rate = self.rates.get(source_currency.upper(), 1.0)
        if rate == 0:
            return amount
        return round(amount / rate, 4)

    def format_currency(self, amount_usd: float, currency: str = "USD") -> str:
        curr = currency.upper()
        converted = self.convert_from_usd(amount_usd, curr)
        symbol = self.currency_symbols.get(curr, "$")
        if curr == "JPY":
            return f"{symbol}{int(converted):,}"
        return f"{symbol}{converted:,.4f}"

    def get_all_rates(self) -> Dict[str, Any]:
        return {
            "base": self.base_currency,
            "rates": self.rates,
            "symbols": self.currency_symbols,
            "last_updated": self.last_updated
        }

currency_service = MultiCurrencyService()
