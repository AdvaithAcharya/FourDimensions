import time
import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
from backend.config import settings
from backend.currency import currency_service
from backend.pricing import pricing_engine

logger = logging.getLogger("scryptic.db")
logging.basicConfig(level=logging.INFO)

# In-memory resilient stores
in_memory_logs: List[Dict[str, Any]] = []

# Motor MongoDB instance
mongo_client = None
db = None

async def init_databases():
    global mongo_client, db
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
        await mongo_client.admin.command('ping')
        db = mongo_client[settings.DATABASE_NAME]
        logger.info("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        logger.warning(f"MongoDB connection unfulfilled ({e}). Operating in resilient In-Memory FinOps Store.")
        mongo_client = None
        db = None

async def save_usage_record(record: Dict[str, Any]):
    """Saves an immutable FinOps request usage record."""
    if "timestamp_epoch" not in record:
        record["timestamp_epoch"] = time.time()
    if "timestamp" not in record:
        record["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(record["timestamp_epoch"]))

    # Ensure _id is never kept in the in-memory object
    record.pop("_id", None)

    # Insert at top of in-memory list (bounded at 5000 items)
    in_memory_logs.insert(0, record)
    if len(in_memory_logs) > 5000:
        in_memory_logs.pop()

    if db is not None:
        try:
            doc_to_save = record.copy()
            await db.usage_logs.insert_one(doc_to_save)
        except Exception as e:
            logger.warning(f"Mongo insert failed: {e}")

async def get_recent_usage_logs(
    limit: int = 50,
    team: Optional[str] = None,
    feature: Optional[str] = None,
    model: Optional[str] = None,
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """Fetches recent logs with multi-currency formatting and optional dimensional filtering."""
    curr = currency.upper()
    symbol = currency_service.currency_symbols.get(curr, "$")
    
    results = []
    # In-memory filter
    for log in in_memory_logs:
        if team and log.get("team") != team:
            continue
        if feature and log.get("feature") != feature:
            continue
        if model and log.get("model") != model:
            continue

        item = dict(log)
        item.pop("_id", None)
        cost_usd = item.get("total_cost_usd", 0.0)
        conv = currency_service.convert_from_usd(cost_usd, curr)
        item["total_cost_display"] = f"{symbol}{conv:,.4f}" if curr != "JPY" else f"{symbol}{int(conv):,}"
        item["currency"] = curr
        results.append(item)
        if len(results) >= limit:
            break

    return results

async def get_finops_summary(currency: str = "USD") -> Dict[str, Any]:
    """Computes high-level aggregated FinOps metrics with currency conversion."""
    curr = currency.upper()
    symbol = currency_service.currency_symbols.get(curr, "$")

    total_requests = len(in_memory_logs)
    if total_requests == 0:
        return {
            "total_cost_usd": 0.0,
            "total_cost_formatted": f"{symbol}0.00",
            "total_requests": 0,
            "total_tokens": 0,
            "total_prompt_tokens": 0,
            "total_completion_tokens": 0,
            "avg_latency_ms": 0.0,
            "avg_cost_per_request": f"{symbol}0.00",
            "top_team": "N/A",
            "top_feature": "N/A",
            "top_model": "N/A",
            "selected_currency": curr,
            "currency_symbol": symbol
        }

    total_cost_usd = sum(Decimal(str(r.get("total_cost_usd", 0))) for r in in_memory_logs)
    total_tokens = sum(r.get("total_tokens", 0) for r in in_memory_logs)
    total_prompt_tokens = sum(r.get("prompt_tokens", 0) for r in in_memory_logs)
    total_completion_tokens = sum(r.get("completion_tokens", 0) for r in in_memory_logs)
    avg_latency = sum(r.get("latency_ms", 0.0) for r in in_memory_logs) / total_requests

    # Top drivers
    team_costs: Dict[str, Decimal] = {}
    feature_costs: Dict[str, Decimal] = {}
    model_costs: Dict[str, Decimal] = {}

    for r in in_memory_logs:
        c = Decimal(str(r.get("total_cost_usd", 0)))
        team_costs[r.get("team", "Unknown")] = team_costs.get(r.get("team", "Unknown"), Decimal(0)) + c
        feature_costs[r.get("feature", "Unknown")] = feature_costs.get(r.get("feature", "Unknown"), Decimal(0)) + c
        model_costs[r.get("model", "Unknown")] = model_costs.get(r.get("model", "Unknown"), Decimal(0)) + c

    top_team = max(team_costs.items(), key=lambda x: x[1])[0] if team_costs else "N/A"
    top_feature = max(feature_costs.items(), key=lambda x: x[1])[0] if feature_costs else "N/A"
    top_model = max(model_costs.items(), key=lambda x: x[1])[0] if model_costs else "N/A"

    float_total_cost = float(total_cost_usd)
    converted_total = currency_service.convert_from_usd(float_total_cost, curr)
    avg_cost_req = converted_total / total_requests if total_requests > 0 else 0.0

    return {
        "total_cost_usd": round(float_total_cost, 6),
        "total_cost_formatted": f"{symbol}{converted_total:,.4f}" if curr != "JPY" else f"{symbol}{int(converted_total):,}",
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "total_prompt_tokens": total_prompt_tokens,
        "total_completion_tokens": total_completion_tokens,
        "avg_latency_ms": round(avg_latency, 1),
        "avg_cost_per_request": f"{symbol}{avg_cost_req:,.4f}" if curr != "JPY" else f"{symbol}{int(avg_cost_req):,}",
        "top_team": top_team,
        "top_feature": top_feature,
        "top_model": top_model,
        "selected_currency": curr,
        "currency_symbol": symbol
    }

async def get_finops_breakdown(
    group_by: str = "team",
    time_window: Optional[str] = "all",
    currency: str = "USD"
) -> List[Dict[str, Any]]:
    """Groups logs by 'team', 'feature', 'model', or 'time_period' with optional time_window filter."""
    curr = currency.upper()
    symbol = currency_service.currency_symbols.get(curr, "$")
    
    # Filter logs by time window if specified
    now = time.time()
    filtered_logs = in_memory_logs
    if time_window == "1h":
        filtered_logs = [r for r in in_memory_logs if r.get("timestamp_epoch", 0) >= now - 3600]
    elif time_window == "24h":
        filtered_logs = [r for r in in_memory_logs if r.get("timestamp_epoch", 0) >= now - 86400]
    elif time_window == "7d":
        filtered_logs = [r for r in in_memory_logs if r.get("timestamp_epoch", 0) >= now - 604800]
    
    groups: Dict[str, Dict[str, Any]] = {}
    total_cost_all = Decimal(0)

    for r in filtered_logs:
        if group_by in ("time_period", "hourly", "time"):
            ts = r.get("timestamp", "")
            k = ts[:13] + ":00" if len(ts) >= 13 else "Recent"
        else:
            group_key = group_by if group_by in ("team", "feature", "model", "environment") else "team"
            k = r.get(group_key, "Unassigned")

        c = Decimal(str(r.get("total_cost_usd", 0)))
        tokens = r.get("total_tokens", 0)
        
        total_cost_all += c
        if k not in groups:
            groups[k] = {"key": k, "cost_dec": Decimal(0), "tokens": 0, "requests": 0}
        
        groups[k]["cost_dec"] += c
        groups[k]["tokens"] += tokens
        groups[k]["requests"] += 1

    results = []
    for k, data in groups.items():
        cost_usd = float(data["cost_dec"])
        converted = currency_service.convert_from_usd(cost_usd, curr)
        pct = float((data["cost_dec"] / total_cost_all) * Decimal(100)) if total_cost_all > 0 else 0.0
        
        results.append({
            "key": k,
            "total_cost_usd": round(cost_usd, 6),
            "total_cost_formatted": f"{symbol}{converted:,.4f}" if curr != "JPY" else f"{symbol}{int(converted):,}",
            "total_tokens": data["tokens"],
            "request_count": data["requests"],
            "percentage": round(pct, 2)
        })

    # Sort: chronological if time_period, otherwise descending by cost
    if group_by in ("time_period", "hourly", "time"):
        results.sort(key=lambda x: x["key"])
    else:
        results.sort(key=lambda x: x["total_cost_usd"], reverse=True)
    return results

async def get_finops_timeseries(limit: int = 20, currency: str = "USD") -> Dict[str, Any]:
    """Generates sequential timeseries datapoints for dashboard charts."""
    curr = currency.upper()
    symbol = currency_service.currency_symbols.get(curr, "$")

    # Take the latest 'limit' requests reversed chronologically
    recent = list(reversed(in_memory_logs[:limit]))
    labels = []
    cost_series = []
    token_series = []

    cumulative_cost = Decimal(0)
    for r in recent:
        labels.append(r.get("timestamp", "").split(" ")[-1])
        c = Decimal(str(r.get("total_cost_usd", 0)))
        cumulative_cost += c
        conv_c = currency_service.convert_from_usd(float(cumulative_cost), curr)
        cost_series.append(round(conv_c, 4))
        token_series.append(r.get("total_tokens", 0))

    return {
        "labels": labels if labels else ["00:00:00"],
        "cost_series": cost_series if cost_series else [0],
        "token_series": token_series if token_series else [0],
        "currency": curr,
        "currency_symbol": symbol
    }

async def clear_all_data():
    """Wipes in-memory logs and MongoDB collections for test validation resets."""
    global in_memory_logs
    in_memory_logs.clear()
    if db is not None:
        try:
            await db.usage_logs.delete_many({})
        except Exception:
            pass
