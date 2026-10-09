from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class Message(BaseModel):
    role: str
    content: Union[str, List[Dict[str, Any]]]

class AttributionMetadata(BaseModel):
    team: str = "Engineering"
    feature: str = "General"
    user: str = "corp_user_01"
    environment: str = "production"

class ChatCompletionRequest(BaseModel):
    model: str = "gpt-4o"
    messages: List[Message]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    attribution: Optional[Dict[str, Any]] = None
    team: Optional[str] = None
    feature: Optional[str] = None
    user_id: Optional[str] = None
    environment: Optional[str] = None

class UsageRecord(BaseModel):
    id: str
    timestamp: str
    timestamp_epoch: float
    team: str
    feature: str
    user: str
    environment: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    input_cost_usd: float
    output_cost_usd: float
    total_cost_usd: float
    total_cost_usd_exact: str
    latency_ms: float
    provider_mode: str  # "live" | "simulated"
    status_code: int = 200

class FinOpsSummary(BaseModel):
    total_cost_usd: float
    total_cost_formatted: str
    total_requests: int
    total_tokens: int
    total_prompt_tokens: int
    total_completion_tokens: int
    avg_latency_ms: float
    top_team: str
    top_feature: str
    top_model: str
    selected_currency: str = "USD"
    currency_symbol: str = "$"

class BreakdownItem(BaseModel):
    key: str
    total_cost_usd: float
    total_cost_formatted: str
    total_tokens: int
    request_count: int
    percentage: float

class ValidationComparison(BaseModel):
    metric: str
    expected_value: Any
    actual_value: Any
    difference: Any
    status: str  # "MATCH" | "MISMATCH"

class ValidationReport(BaseModel):
    timestamp: str
    dataset_size: int
    comparisons: List[ValidationComparison]
    discrepancy_rate_pct: float
    verification_latency_ms: float
    reconciliation_status: str  # "100% RECONCILED - AUDIT PASSED"
