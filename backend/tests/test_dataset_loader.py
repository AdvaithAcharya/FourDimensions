import io
import json
import pytest
from backend.dataset_loader import DatasetAnalysisEngine

@pytest.mark.asyncio
async def test_tokens_only_csv_calculates_correct_nonzero_cost():
    """Requirement 2: CSV with only tokens (no cost_usd column) gives correct non-zero cost."""
    # gpt-4o: 1000 in ($0.0025) + 500 out ($0.0050) = $0.0075
    csv_content = (
        "request_id,model,prompt_tokens,completion_tokens,team,feature,user_id\n"
        "req_01,gpt-4o,1000,500,Engineering,CodeReview-Bot,dev_01\n"
        "req_02,gpt-4o,2000,1000,Data-Science,Model-Eval,ds_01\n"
    ).encode("utf-8")

    result = await DatasetAnalysisEngine.process_dataset(csv_content, "tokens_only.csv")
    assert result["status"] == "SUCCESS"
    assert result["total_records"] == 2
    # req_01: 0.0075, req_02: 0.0150 -> total 0.0225
    assert float(result["total_cost_usd"]) == pytest.approx(0.0225, rel=1e-5)
    assert result["total_tokens"] == 4500

@pytest.mark.asyncio
async def test_openai_style_jsonl_counts_tokens_correctly():
    """Requirement 2: OpenAI-style JSONL with prompt_tokens and completion_tokens counts tokens."""
    lines = [
        json.dumps({
            "id": "chatcmpl-1",
            "model": "gpt-4o-mini",
            "prompt_tokens": 800,
            "completion_tokens": 200,
            "team": "Customer-Support",
            "feature": "Live-Chat",
            "user_id": "sup_1"
        }),
        json.dumps({
            "id": "chatcmpl-2",
            "model": "gpt-4o-mini",
            "prompt_tokens": 1200,
            "completion_tokens": 400,
            "team": "Customer-Support",
            "feature": "Ticket-Sum",
            "user_id": "sup_2"
        })
    ]
    jsonl_bytes = "\n".join(lines).encode("utf-8")

    result = await DatasetAnalysisEngine.process_dataset(jsonl_bytes, "openai_telemetry.jsonl")
    assert result["status"] == "SUCCESS"
    assert result["total_records"] == 2
    assert result["total_input_tokens"] == 2000
    assert result["total_output_tokens"] == 600
    assert result["total_tokens"] == 2600
    assert float(result["total_cost_usd"]) > 0

@pytest.mark.asyncio
async def test_anthropic_style_jsonl_nested_usage_counts_tokens():
    """Requirement 2: Anthropic-style JSONL with usage.input_tokens and usage.output_tokens counts tokens."""
    lines = [
        json.dumps({
            "id": "msg_01",
            "model": "claude-3-5-sonnet",
            "usage": {
                "input_tokens": 5000,
                "output_tokens": 1500
            },
            "metadata": {
                "team": "Data-Science",
                "feature": "Extraction",
                "user_id": "ds_42"
            }
        })
    ]
    jsonl_bytes = "\n".join(lines).encode("utf-8")

    result = await DatasetAnalysisEngine.process_dataset(jsonl_bytes, "anthropic_telemetry.jsonl")
    assert result["status"] == "SUCCESS"
    assert result["total_records"] == 1
    assert result["total_input_tokens"] == 5000
    assert result["total_output_tokens"] == 1500
    assert result["total_tokens"] == 6500
    # claude-3-5-sonnet: 5000 in ($3/1M = $0.015) + 1500 out ($15/1M = $0.0225) = $0.0375
    assert float(result["total_cost_usd"]) == pytest.approx(0.0375, rel=1e-5)

@pytest.mark.asyncio
async def test_text_length_token_estimation_when_tokens_missing():
    """Requirement 2: If tokens missing but prompt/response text exists, estimate them (len/4) and mark estimated."""
    lines = [
        json.dumps({
            "model": "gpt-4o",
            "prompt": "1234567890123456",  # 16 chars -> 4 tokens
            "response": "12345678",           # 8 chars -> 2 tokens
            "team": "Engineering"
        })
    ]
    jsonl_bytes = "\n".join(lines).encode("utf-8")

    result = await DatasetAnalysisEngine.process_dataset(jsonl_bytes, "text_data.jsonl")
    assert result["status"] == "SUCCESS"
    assert result["total_records"] == 1
    assert result["total_input_tokens"] == 4
    assert result["total_output_tokens"] == 2
    assert result["estimated_token_rows"] == 1

@pytest.mark.asyncio
async def test_robustness_bad_row_routed_to_rejected_list():
    """Requirement 6: Bad row does not fail the whole upload; routed to rejected list."""
    csv_content = (
        "request_id,model,input_tokens,output_tokens,team\n"
        "req_01,gpt-4o,1000,500,Engineering\n"
        "req_bad,gpt-4o,not_a_number_error,bad_tokens,Data-Science\n"
        "req_02,gpt-4o,2000,800,Marketing\n"
    ).encode("utf-8")

    result = await DatasetAnalysisEngine.process_dataset(csv_content, "mixed_data.csv")
    assert result["status"] == "SUCCESS"
    assert result["total_records"] == 2
    assert result["rejected_count"] == 1
    assert len(result["rejected_samples"]) == 1
    assert "Invalid" in result["rejected_samples"][0]["reason"] or "invalid" in result["rejected_samples"][0]["reason"].lower()
