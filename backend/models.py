from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "gpt-4o"
    messages: List[Message]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    user_id: Optional[str] = "user_freemium_01"
    api_key: Optional[str] = "kg_live_demo_key_99"

class ThreatLog(BaseModel):
    id: str
    timestamp: str
    client_ip: str
    user_id: str
    threat_type: str  # "COMPLEXITY_EXCEEDED", "VELOCITY_BREACH", "BUDGET_EXHAUSTED"
    severity: str    # "CRITICAL", "HIGH", "MEDIUM"
    detail: str
    tokens_blocked: int
    cost_saved_usd: float
    cost_saved_inr: float
    cost_saved_eur: float
    status_code: int

class UserBudget(BaseModel):
    user_id: str
    tier: str = "freemium"
    daily_budget_usd: float = 0.50
    current_spent_usd: float = 0.0
    requests_today: int = 0
    blocked_attacks: int = 0
    currency_pref: str = "USD"

class SystemStats(BaseModel):
    total_requests: int
    total_tokens_processed: int
    total_tokens_blocked: int
    blocked_threat_count: int
    total_cost_saved_usd: float
    total_cost_saved_inr: float
    total_cost_saved_eur: float
    total_cost_saved_gbp: float
    avg_latency_ms: float
    status: str = "PROTECTED"
    current_currency: str = "USD"
