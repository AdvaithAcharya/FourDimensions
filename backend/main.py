import time
import uuid
import logging
import asyncio
import httpx
from fastapi import FastAPI, Request, HTTPException, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import json

try:
    from google import genai
except ImportError:
    genai = None

from backend.config import settings
from backend.models import ChatCompletionRequest, ThreatLog, SystemStats
from backend.db import (
    init_databases, save_threat_log, get_recent_threat_logs,
    get_system_stats, record_successful_request, get_user_budget_db
)
from backend.currency import currency_service
from backend.security.tokenizer import tokenizer_engine
from backend.security.velocity import velocity_tracker
from backend.security.budget import budget_engine

logger = logging.getLogger("krypton.gateway")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Active-Defense AI Gateway mitigating token-burn and Denial-of-Wallet attacks."
)

genai_client = None
if settings.GEMINI_API_KEY and genai:
    try:
        genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Google GenAI client initialized.")
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client: {e}")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_databases()
    # Refresh exchange rates on startup asynchronously
    asyncio.create_task(currency_service.refresh_rates())
    logger.info("Krypton Gateway active-defense proxy operational!")

@app.get("/")
async def root():
    return {
        "status": "Krypton Gateway Active-Defense Operating System",
        "version": settings.VERSION,
        "mode": "PROTECTED",
        "preflight_tokenizer": "tiktoken (cl100k_base)",
        "velocity_limiter": "Redis Sliding Window",
        "multi_currency": "Base-USD Active Conversion Engine"
    }

# ============================================================================
# 1. CORE SECURITY GATEWAY PROXY ENDPOINT
# ============================================================================
@app.post("/v1/chat/completions")
async def chat_completions_proxy(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
        
    start_time = time.time()
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_id = body.get("user_id", "user_freemium_01")
    
    messages = body.get("messages", [])
    max_out_tokens = body.get("max_tokens", 1000)

    # ------------------------------------------------------------------------
    # STEP 1: Tiktoken Pre-Flight Token Complexity Estimation ($0 Spent)
    # ------------------------------------------------------------------------
    is_allowed_complexity, input_tokens, estimated_cost_usd, block_reason, media_stats = (
        tokenizer_engine.evaluate_preflight_complexity(messages, max_out_tokens)
    )

    if not is_allowed_complexity:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        log_id = f"th_{uuid.uuid4().hex[:8]}"
        
        cost_inr = currency_service.convert_from_usd(estimated_cost_usd, "INR")
        cost_eur = currency_service.convert_from_usd(estimated_cost_usd, "EUR")

        threat_entry = {
            "id": log_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "client_ip": client_ip,
            "user_id": user_id,
            "threat_type": "COMPLEXITY_EXCEEDED",
            "severity": "CRITICAL",
            "detail": block_reason,
            "tokens_blocked": input_tokens + max_out_tokens,
            "cost_saved_usd": estimated_cost_usd,
            "cost_saved_inr": cost_inr,
            "cost_saved_eur": cost_eur,
            "status_code": 400,
            "latency_ms": latency_ms,
            "media_stats": media_stats
        }
        await save_threat_log(threat_entry)
        await budget_engine.record_blocked_attack(user_id)

        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "message": block_reason,
                    "type": "preflight_token_burn_blocked",
                    "code": "OWASP_LLM10_UNBOUNDED_CONSUMPTION",
                    "param": "messages",
                    "tokens_eval": input_tokens,
                    "financial_cost_prevented_usd": estimated_cost_usd,
                    "preflight_latency_ms": latency_ms
                }
            }
        )

    # ------------------------------------------------------------------------
    # STEP 2: Redis Anomaly & Velocity Trap (Request Frequency & Cost Rate)
    # ------------------------------------------------------------------------
    is_allowed_velocity, velocity_reason, current_reqs, current_cost_velocity = (
        await velocity_tracker.check_velocity(user_id, estimated_cost_usd)
    )

    if not is_allowed_velocity:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        log_id = f"th_{uuid.uuid4().hex[:8]}"
        
        cost_inr = currency_service.convert_from_usd(estimated_cost_usd, "INR")
        cost_eur = currency_service.convert_from_usd(estimated_cost_usd, "EUR")

        threat_entry = {
            "id": log_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "client_ip": client_ip,
            "user_id": user_id,
            "threat_type": "VELOCITY_BREACH",
            "severity": "HIGH",
            "detail": velocity_reason,
            "tokens_blocked": input_tokens + max_out_tokens,
            "cost_saved_usd": estimated_cost_usd,
            "cost_saved_inr": cost_inr,
            "cost_saved_eur": cost_eur,
            "status_code": 429,
            "latency_ms": latency_ms,
            "media_stats": media_stats
        }
        await save_threat_log(threat_entry)
        await budget_engine.record_blocked_attack(user_id)

        return JSONResponse(
            status_code=429,
            content={
                "error": {
                    "message": velocity_reason,
                    "type": "anomaly_velocity_trap_triggered",
                    "code": "TOO_MANY_REQUESTS",
                    "cost_velocity_usd_per_min": current_cost_velocity,
                    "financial_cost_prevented_usd": estimated_cost_usd,
                    "preflight_latency_ms": latency_ms
                }
            }
        )

    # ------------------------------------------------------------------------
    # STEP 3: Per-User Micro-Budget Verification Engine
    # ------------------------------------------------------------------------
    is_allowed_budget, budget_reason, user_budget = await budget_engine.evaluate_budget_authorization(user_id, estimated_cost_usd)

    if not is_allowed_budget:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        log_id = f"th_{uuid.uuid4().hex[:8]}"
        
        cost_inr = currency_service.convert_from_usd(estimated_cost_usd, "INR")
        cost_eur = currency_service.convert_from_usd(estimated_cost_usd, "EUR")

        threat_entry = {
            "id": log_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "client_ip": client_ip,
            "user_id": user_id,
            "threat_type": "BUDGET_EXHAUSTED",
            "severity": "MEDIUM",
            "detail": budget_reason,
            "tokens_blocked": input_tokens + max_out_tokens,
            "cost_saved_usd": estimated_cost_usd,
            "cost_saved_inr": cost_inr,
            "cost_saved_eur": cost_eur,
            "status_code": 402,
            "latency_ms": latency_ms,
            "media_stats": media_stats
        }
        await save_threat_log(threat_entry)
        await budget_engine.record_blocked_attack(user_id)

        return JSONResponse(
            status_code=402,
            content={
                "error": {
                    "message": budget_reason,
                    "type": "daily_budget_ceiling_exhausted",
                    "code": "PAYMENT_REQUIRED",
                    "user_id": user_id,
                    "financial_cost_prevented_usd": estimated_cost_usd,
                    "preflight_latency_ms": latency_ms
                }
            }
        )

    # ------------------------------------------------------------------------
    # STEP 4: Invoke Commercial LLM Proxy / Local Safe Fallback Endpoint
    # ------------------------------------------------------------------------
    if not settings.GEMINI_API_KEY:
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "message": "Gateway is in Strict Production Mode. GEMINI_API_KEY is not configured.",
                    "type": "api_key_missing_error",
                    "code": "LLM_PROVIDER_UNAVAILABLE"
                }
            }
        )

    # TRUE TRANSPARENT PROXY MODE (SSE)
    async def generate_and_stream():
        try:
            payload = body.copy()
            # Remove our custom user_id so upstream doesn't complain about unknown fields
            payload.pop("user_id", None)
            
            # Default model routing for OpenAI schema to Gemini
            if "model" not in payload or "gemini" not in payload.get("model", ""):
                payload["model"] = "gemini-3.5-flash"
                
            headers = {
                "Authorization": f"Bearer {settings.GEMINI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            total_output_chars = 0
            
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                ) as response:
                    async for chunk in response.aiter_text():
                        if chunk:
                            total_output_chars += len(chunk)
                            yield chunk
            
            # Calculate actual cost post-generation (estimating token mapping from SSE string length)
            actual_output_tokens = total_output_chars // 15
            actual_cost_usd = (input_tokens / 1000.0 * settings.INPUT_TOKEN_COST_PER_1K) + (actual_output_tokens / 1000.0 * settings.OUTPUT_TOKEN_COST_PER_1K)
            
            await budget_engine.record_usage(user_id, actual_cost_usd)
            latency_ms = round((time.time() - start_time) * 1000, 2)
            await record_successful_request(
                tokens_used=input_tokens + actual_output_tokens, 
                latency_ms=latency_ms,
                media_stats=media_stats
            )
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            yield f"data: {json.dumps({'choices': [{'delta': {'content': f'[ERROR IN STREAM: {str(e)}]'}}]})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate_and_stream(), media_type="text/event-stream")


# ============================================================================
# 2. DASHBOARD OBSERVABILITY & MULTI-CURRENCY API ENDPOINTS
# ============================================================================
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(currency: str = "USD"):
    from backend.db import get_system_stats
    raw_stats = await get_system_stats()
    curr = currency.upper()
    
    total_saved_usd = raw_stats["total_cost_saved_usd"]
    converted_savings = currency_service.convert_from_usd(total_saved_usd, curr)
    symbol = currency_service.currency_symbols.get(curr, "$")
    
    return {
        "total_requests": raw_stats["total_requests"],
            "total_tokens_processed": raw_stats["total_tokens_processed"],
            "total_tokens_blocked": raw_stats["total_tokens_blocked"],
            "blocked_threat_count": raw_stats["blocked_threat_count"],
            "total_cost_saved": round(converted_savings, 4),
            "total_cost_saved_formatted": f"{symbol}{converted_savings:,.2f}" if curr != "JPY" else f"{symbol}{int(converted_savings):,}",
            "total_cost_saved_usd": round(total_saved_usd, 4),
            "avg_latency_ms": raw_stats["avg_latency_ms"],
            "status": "PROTECTED",
            "selected_currency": curr,
            "currency_symbol": symbol,
            "total_images_blocked": raw_stats.get("total_images_blocked", 0),
            "total_audio_blocked": raw_stats.get("total_audio_blocked", 0),
            "total_video_blocked": raw_stats.get("total_video_blocked", 0)
    }

@app.get("/api/dashboard/logs")
async def get_dashboard_logs(limit: int = 50, currency: str = "USD"):
    logs = await get_recent_threat_logs(limit=limit)
    curr = currency.upper()
    symbol = currency_service.currency_symbols.get(curr, "$")
    
    formatted_logs = []
    for log in logs:
        log_copy = dict(log)
        cost_usd = log_copy.get("cost_saved_usd", 0.0)
        converted = currency_service.convert_from_usd(cost_usd, curr)
        log_copy["cost_saved_display"] = f"{symbol}{converted:,.4f}"
        formatted_logs.append(log_copy)
        
    return formatted_logs

@app.get("/api/currency/rates")
async def get_currency_rates():
    return currency_service.get_all_rates()

@app.get("/api/user/budget/{user_id}")
async def get_user_budget_api(user_id: str, currency: str = "USD"):
    user_data = await get_user_budget_db(user_id)
    curr = currency.upper()
    
    daily_usd = user_data.get("daily_budget_usd", 0.50)
    spent_usd = user_data.get("current_spent_usd", 0.0)
    
    daily_conv = currency_service.convert_from_usd(daily_usd, curr)
    spent_conv = currency_service.convert_from_usd(spent_usd, curr)
    symbol = currency_service.currency_symbols.get(curr, "$")
    
    return {
        **user_data,
        "selected_currency": curr,
        "daily_budget_formatted": f"{symbol}{daily_conv:,.2f}",
        "current_spent_formatted": f"{symbol}{spent_conv:,.4f}",
        "remaining_budget_formatted": f"{symbol}{max(0, daily_conv - spent_conv):,.4f}"
    }
