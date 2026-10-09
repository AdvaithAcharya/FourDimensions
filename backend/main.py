import sys
from pathlib import Path

# Ensure project root is in sys.path regardless of CWD
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import time
import uuid
import logging
import asyncio
import json
import httpx
from decimal import Decimal
from typing import Optional, List, Dict, Any

import os
from fastapi import FastAPI, Request, HTTPException, Depends, Header, BackgroundTasks, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

import tiktoken

from backend.config import settings
from backend.models import ChatCompletionRequest, UsageRecord, FinOpsSummary, BreakdownItem
from backend.pricing import pricing_engine
from backend.validator import FinOpsValidator
from backend.dataset_loader import DatasetAnalysisEngine
from backend.currency import currency_service
from backend.db import (
    init_databases, save_usage_record, get_recent_usage_logs,
    get_finops_summary, get_finops_breakdown, get_finops_timeseries,
    clear_all_data, in_memory_logs, is_mongodb_connected
)

logger = logging.getLogger("krypton.gateway")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise LLM FinOps Observability & Attribution Gateway"
)

# Tiktoken tokenizer instance (O(1) initialization cached)
try:
    tokenizer = tiktoken.get_encoding("cl100k_base")
except Exception:
    tokenizer = None

def count_tokens(text: str) -> int:
    if not text:
        return 0
    if tokenizer:
        return len(tokenizer.encode(str(text)))
    return max(1, len(str(text)) // 4)

def count_messages_tokens(messages: List[Dict[str, Any]]) -> int:
    total = 0
    for m in messages:
        total += 4  # protocol overhead
        content = m.get("content", "")
        if isinstance(content, str):
            total += count_tokens(content)
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and "text" in part:
                    total += count_tokens(part["text"])
                else:
                    total += 65  # multimodal token approximation
        role = m.get("role", "")
        if isinstance(role, str):
            total += count_tokens(role)
    total += 2  # assistant priming
    return total

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
    asyncio.create_task(currency_service.refresh_rates())
    logger.info("Krypton LLM FinOps Observability Gateway operational!")

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "Simulated Provider" if settings.MOCK_PROVIDER else "Live Gemini Proxy",
        "pricing_engine": "Decimal Fixed-Point (8-decimal precision)",
        "database": {
            "connected": is_mongodb_connected(),
            "provider": "MongoDB Atlas" if is_mongodb_connected() else "In-Memory Resilient Store",
            "cluster": "Cluster1",
            "database_name": settings.DATABASE_NAME
        },
        "supported_models": list(pricing_engine.pricing_table.keys()),
        "status": "HEALTHY"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "database": {
            "connected": is_mongodb_connected(),
            "provider": "MongoDB Atlas" if is_mongodb_connected() else "In-Memory Resilient Store",
            "cluster": "Cluster1",
            "database_name": settings.DATABASE_NAME
        }
    }

# ============================================================================
# 1. CORE OBSERVABILITY PROXY WITH ATTRIBUTION METADATA PARSER
# ============================================================================
@app.post("/v1/chat/completions")
async def chat_completions_proxy(
    request: Request,
    background_tasks: BackgroundTasks,
    x_team: Optional[str] = Header(None, alias="X-Team"),
    x_feature: Optional[str] = Header(None, alias="X-Feature"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_env: Optional[str] = Header(None, alias="X-Environment")
):
    start_time = time.perf_counter()
    epoch_now = time.time()
    req_id = f"req_{uuid.uuid4().hex[:10]}"

    try:
        body = await request.json()
    except Exception:
        body = {}

    # Extract Attribution Metadata (Priority: Body Attribution > Body Root > Header > Default)
    body_attrib = body.get("attribution", {}) if isinstance(body.get("attribution"), dict) else {}
    team = body_attrib.get("team") or body.get("team") or x_team or "Engineering"
    feature = body_attrib.get("feature") or body.get("feature") or x_feature or "General"
    user_id = body_attrib.get("user") or body.get("user_id") or x_user_id or "corp_user_01"
    environment = body_attrib.get("environment") or body.get("environment") or x_env or "production"
    
    model = body.get("model", "gpt-4o")
    messages = body.get("messages", [])
    max_tokens = body.get("max_tokens", 400)
    is_stream = bool(body.get("stream", False))

    # Calculate Input Tokens
    input_tokens = count_messages_tokens(messages)
    if input_tokens == 0:
        input_tokens = 15

    # ------------------------------------------------------------------------
    # BRANCH A: HIGH-FIDELITY SIMULATED LLM PROVIDER (Zero External API Dependency)
    # ------------------------------------------------------------------------
    if settings.MOCK_PROVIDER or not settings.GEMINI_API_KEY:
        # Realistic simulated completion
        simulated_texts = [
            f"Here is the optimized enterprise analysis for {feature}. The FinOps framework guarantees real-time cost attribution across team '{team}' using the defined multi-model pricing catalog.",
            f"Completed processing query for {user_id}. Executing vector retrieval and synthesizer logic with high fidelity and verified token accounting.",
            f"System metrics normal for {feature}. Total latency and cost estimates successfully recorded in the immutable audit ledger."
        ]
        response_text = simulated_texts[hash(user_id + str(len(messages))) % len(simulated_texts)]
        output_tokens = count_tokens(response_text)

        # Exact Decimal Cost Calculation (O(1) time and space)
        in_cost, out_cost, total_cost, matched_model = pricing_engine.calculate_cost(
            model, input_tokens, output_tokens
        )
        
        latency_ms = round((time.perf_counter() - start_time) * 1000 + settings.SIMULATED_LATENCY_MS, 2)

        # Construct FinOps Record
        record = {
            "id": req_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(epoch_now)),
            "timestamp_epoch": epoch_now,
            "team": team,
            "feature": feature,
            "user": user_id,
            "environment": environment,
            "model": matched_model,
            "prompt_tokens": input_tokens,
            "completion_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "input_cost_usd": float(in_cost),
            "output_cost_usd": float(out_cost),
            "total_cost_usd": float(total_cost),
            "total_cost_usd_exact": str(total_cost),
            "latency_ms": latency_ms,
            "provider_mode": "simulated",
            "status_code": 200
        }
        background_tasks.add_task(save_usage_record, record)

        if is_stream:
            async def simulated_streamer():
                chunks = response_text.split(" ")
                for i, word in enumerate(chunks):
                    chunk_payload = {
                        "id": req_id,
                        "object": "chat.completion.chunk",
                        "created": int(epoch_now),
                        "model": matched_model,
                        "choices": [{
                            "index": 0,
                            "delta": {"content": word + (" " if i < len(chunks) - 1 else "")},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(chunk_payload)}\n\n"
                    await asyncio.sleep(0.015)  # simulate stream pacing

                # Final chunk
                final_chunk = {
                    "id": req_id,
                    "object": "chat.completion.chunk",
                    "created": int(epoch_now),
                    "model": matched_model,
                    "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
                }
                yield f"data: {json.dumps(final_chunk)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(simulated_streamer(), media_type="text/event-stream")
        else:
            return JSONResponse(content={
                "id": req_id,
                "object": "chat.completion",
                "created": int(epoch_now),
                "model": matched_model,
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": input_tokens,
                    "completion_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens
                },
                "attribution": {
                    "team": team,
                    "feature": feature,
                    "user": user_id,
                    "cost_usd": str(total_cost)
                }
            })

    # ------------------------------------------------------------------------
    # BRANCH B: LIVE PROXY VIA GOOGLE GEMINI OPENAI ENDPOINT
    # ------------------------------------------------------------------------
    headers = {
        "Authorization": f"Bearer {settings.GEMINI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = body.copy()
    payload.pop("attribution", None)
    payload.pop("team", None)
    payload.pop("feature", None)
    payload.pop("user_id", None)
    payload.pop("environment", None)
    if "model" not in payload or "gemini" not in payload.get("model", ""):
        payload["model"] = "gemini-1.5-flash"

    async def live_streamer():
        total_chars = 0
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=60.0
                ) as upstream_resp:
                    async for chunk in upstream_resp.aiter_text():
                        if chunk:
                            total_chars += len(chunk)
                            yield chunk

            output_tokens = max(1, total_chars // 14)
            in_c, out_c, tot_c, matched_m = pricing_engine.calculate_cost(model, input_tokens, output_tokens)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

            record = {
                "id": req_id,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(epoch_now)),
                "timestamp_epoch": epoch_now,
                "team": team,
                "feature": feature,
                "user": user_id,
                "environment": environment,
                "model": matched_m,
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "input_cost_usd": float(in_c),
                "output_cost_usd": float(out_c),
                "total_cost_usd": float(tot_c),
                "total_cost_usd_exact": str(tot_c),
                "latency_ms": latency_ms,
                "provider_mode": "live",
                "status_code": 200
            }
            await save_usage_record(record)
        except Exception as e:
            logger.error(f"Live proxy error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(live_streamer(), media_type="text/event-stream")


# ============================================================================
# 2. FINOPS OBSERVABILITY & ANALYTICS APIS
# ============================================================================
@app.get("/api/finops/summary")
async def get_summary(currency: str = Query("USD")):
    return await get_finops_summary(currency=currency)

@app.get("/api/finops/breakdown")
async def get_breakdown(
    group_by: str = Query("team", description="Dimension: team | feature | model | environment | time_period"),
    time_window: Optional[str] = Query("all", description="Window: all | 1h | 24h | 7d"),
    currency: str = Query("USD")
):
    return await get_finops_breakdown(group_by=group_by, time_window=time_window, currency=currency)

@app.get("/api/finops/timeseries")
async def get_timeseries(
    limit: int = Query(20, ge=5, le=100),
    currency: str = Query("USD")
):
    return await get_finops_timeseries(limit=limit, currency=currency)

@app.get("/api/finops/logs")
async def get_logs(
    limit: int = Query(50, ge=1, le=200),
    team: Optional[str] = None,
    feature: Optional[str] = None,
    model: Optional[str] = None,
    currency: str = Query("USD")
):
    return await get_recent_usage_logs(
        limit=limit, team=team, feature=feature, model=model, currency=currency
    )

@app.get("/api/finops/pricing")
async def get_pricing_catalog():
    return {
        "pricing_model": "Per 1,000,000 Tokens (with per-1k conversions)",
        "models": pricing_engine.get_raw_table()
    }

# ============================================================================
# 3. AUTOMATED VALIDATION & RECONCILIATION AUDIT (Deliverable 4)
# ============================================================================
@app.post("/api/finops/validate")
async def run_reconciliation_audit():
    """Runs the deterministic ground-truth validation suite and outputs reconciliation report."""
    report = await FinOpsValidator.run_audit_suite()
    return report

@app.post("/api/finops/simulate-traffic")
async def simulate_traffic_burst(count: int = Query(5, ge=1, le=50)):
    """Generates synthetic enterprise requests across multiple teams and models."""
    sample_scenarios = [
        ("Engineering", "CodeReview-Bot", "dev_zack", "gpt-4o", 1200, 350),
        ("Engineering", "Architecture-Advisor", "arch_lisa", "claude-3-5-sonnet", 2400, 800),
        ("Customer-Support", "Live-Chatbot", "sup_tom", "gpt-4o-mini", 800, 150),
        ("Data-Science", "Model-Evaluation", "ds_tanya", "gemini-1.5-pro", 6000, 1100),
        ("Marketing", "SEO-Writer", "mkt_ryan", "gemini-1.5-flash", 1500, 400),
    ]

    for i in range(count):
        team, feat, user, model, in_tok, out_tok = sample_scenarios[i % len(sample_scenarios)]
        in_c, out_c, tot_c, matched_m = pricing_engine.calculate_cost(model, in_tok, out_tok)
        now = time.time()
        record = {
            "id": f"sim_{uuid.uuid4().hex[:8]}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now)),
            "timestamp_epoch": now,
            "team": team,
            "feature": feat,
            "user": user,
            "environment": "production",
            "model": matched_m,
            "prompt_tokens": in_tok,
            "completion_tokens": out_tok,
            "total_tokens": in_tok + out_tok,
            "input_cost_usd": float(in_c),
            "output_cost_usd": float(out_c),
            "total_cost_usd": float(tot_c),
            "total_cost_usd_exact": str(tot_c),
            "latency_ms": round(35.0 + (i * 8.5), 1),
            "provider_mode": "simulated",
            "status_code": 200
        }
        await save_usage_record(record)
    return {"status": "SUCCESS", "simulated_count": count}

@app.post("/api/finops/reset")
async def reset_metrics():
    """Wipes all logged FinOps requests and resets totals to zero."""
    await clear_all_data()
    return {"status": "SUCCESS", "message": "All FinOps metrics, logs, and token counters reset to 0."}

# ============================================================================
# 4. BULK DATASET INGESTION & 4-DIMENSIONAL ANALYSIS
# ============================================================================
@app.post("/api/finops/dataset/upload")
async def upload_and_analyze_dataset(
    file: UploadFile = File(...),
    currency: str = Query("USD"),
    commit: bool = Query(False)
):
    """Uploads and analyzes a synthetic or production FinOps dataset (.zip, .csv, .jsonl, .json)."""
    try:
        content = await file.read()
        result = DatasetAnalysisEngine.process_dataset(
            file_bytes=content,
            filename=file.filename,
            currency=currency,
            commit_to_live_ledger=commit
        )
        return result
    except Exception as e:
        logger.error(f"Dataset upload processing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))



# ============================================================================
# 5. BACKWARDS COMPATIBILITY & CURRENCY ROUTES
# ============================================================================
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(currency: str = Query("USD")):
    summary = await get_finops_summary(currency=currency)
    return {
        "total_requests": summary["total_requests"],
        "total_tokens_processed": summary["total_tokens"],
        "total_tokens_blocked": 0,
        "blocked_threat_count": 0,
        "total_cost_saved": summary["total_cost_usd"],
        "total_cost_saved_formatted": summary["total_cost_formatted"],
        "total_cost_saved_usd": summary["total_cost_usd"],
        "avg_latency_ms": summary["avg_latency_ms"],
        "status": "OPERATIONAL",
        "selected_currency": summary["selected_currency"],
        "currency_symbol": summary["currency_symbol"],
        "top_team": summary["top_team"],
        "top_feature": summary["top_feature"],
        "avg_cost_per_request": summary["avg_cost_per_request"]
    }

@app.get("/api/dashboard/logs")
async def get_dashboard_logs(limit: int = 50, currency: str = Query("USD")):
    logs = await get_recent_usage_logs(limit=limit, currency=currency)
    formatted = []
    for l in logs:
        copy_l = dict(l)
        copy_l["threat_type"] = f"ATTRIBUTED: {l.get('team')}"
        copy_l["cost_saved_display"] = l.get("total_cost_display")
        copy_l["detail"] = f"Feature: {l.get('feature')} | Model: {l.get('model')} | Tokens: {l.get('total_tokens')}"
        copy_l["severity"] = "NORMAL"
        formatted.append(copy_l)
    return formatted

@app.get("/api/currency/rates")
async def get_currency_rates():
    return currency_service.get_all_rates()

@app.get("/api/company/analytics")
async def get_company_analytics(currency: str = Query("USD")):
    summary = await get_finops_summary(currency=currency)
    breakdown = await get_finops_breakdown(group_by="team", currency=currency)
    return {
        "company_total_saved_formatted": summary["total_cost_formatted"],
        "company_total_tokens_processed": summary["total_tokens"],
        "active_tenants": len(breakdown),
        "blocked_tenants": 0,
        "currency_symbol": summary["currency_symbol"],
        "tenants": breakdown
    }
