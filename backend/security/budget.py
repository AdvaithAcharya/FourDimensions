import logging
from typing import Tuple, Dict, Any
from backend.db import get_user_budget_db, update_user_budget_db
from backend.currency import currency_service

logger = logging.getLogger("krypton.budget")

class UserBudgetEngine:
    async def evaluate_budget_authorization(self, user_id: str, estimated_cost_usd: float) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Enforces strict daily micro-budgets tied to user authentication and subscription tiers.
        Supports multi-currency formatting for error payloads.
        Returns: (is_authorized, reason_if_blocked, user_budget_details)
        """
        user_budget = await get_user_budget_db(user_id)
        daily_limit = user_budget.get("daily_budget_usd", 0.50)
        current_spent = user_budget.get("current_spent_usd", 0.0)
        
        projected_total = current_spent + estimated_cost_usd
        
        if projected_total > daily_limit:
            curr_pref = user_budget.get("currency_pref", "INR")
            spent_fmt = currency_service.format_currency(current_spent, curr_pref)
            limit_fmt = currency_service.format_currency(daily_limit, curr_pref)
            req_cost_fmt = currency_service.format_currency(estimated_cost_usd, curr_pref)
            
            reason = f"Daily Micro-Budget Ceiling Exhausted for tier '{user_budget.get('tier', 'freemium')}'. Current Spent: {spent_fmt}, Request Cost: {req_cost_fmt}, Daily Ceiling: {limit_fmt}. Request rejected."
            return False, reason, user_budget

        return True, "", user_budget

    async def record_usage(self, user_id: str, actual_cost_usd: float):
        await update_user_budget_db(user_id=user_id, added_spent_usd=actual_cost_usd, request_increment=1, attack_increment=0)

    async def record_blocked_attack(self, user_id: str):
        await update_user_budget_db(user_id=user_id, added_spent_usd=0.0, request_increment=0, attack_increment=1)

budget_engine = UserBudgetEngine()
