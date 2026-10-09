"""
Multi-Tenant Enterprise Traffic Simulator for LLM FinOps Dashboard
Sends realistic requests across Engineering, Data-Science, Support, Marketing, and Product teams.
"""

import asyncio
import httpx
import random
import time

PROXY_URL = "http://127.0.0.1:8000/v1/chat/completions"

ENTERPRISE_PROFILES = [
    {
        "team": "Engineering",
        "feature": "CodeReview-Copilot",
        "user": "eng_dev_chen",
        "model": "gpt-4o",
        "prompt": "Analyze this pull request diff for SQL injection vulnerabilities and boundary edge cases."
    },
    {
        "team": "Engineering",
        "feature": "Architecture-Advisor",
        "user": "eng_arch_priya",
        "model": "claude-3-5-sonnet",
        "prompt": "Design a high-throughput event streaming architecture using Apache Kafka and Redis."
    },
    {
        "team": "Data-Science",
        "feature": "Model-Evaluation",
        "user": "ds_marcus",
        "model": "gemini-1.5-pro",
        "prompt": "Calculate precision, recall, and F1 scores across a 50-class imbalanced classification dataset."
    },
    {
        "team": "Customer-Support",
        "feature": "Ticket-Summarizer",
        "user": "sup_agent_sarah",
        "model": "gpt-4o-mini",
        "prompt": "Summarize this 10-message support conversation into key user pain point and resolution steps."
    },
    {
        "team": "Customer-Support",
        "feature": "Live-Chatbot",
        "user": "sup_agent_alex",
        "model": "gemini-1.5-flash",
        "prompt": "Draft a friendly response explaining the password reset and SSO login procedure."
    },
    {
        "team": "Marketing",
        "feature": "AdCopy-Generator",
        "user": "mkt_lead_jordan",
        "model": "gpt-4o",
        "prompt": "Generate 5 high-converting headlines for our enterprise cloud security product launch."
    },
    {
        "team": "Product",
        "feature": "Spec-Synthesizer",
        "user": "pm_director_elena",
        "model": "claude-3-5-sonnet",
        "prompt": "Extract functional user stories and acceptance criteria from this meeting transcript."
    }
]

async def send_single_request(client: httpx.AsyncClient, profile: dict, index: int):
    payload = {
        "model": profile["model"],
        "messages": [
            {"role": "system", "content": "You are an enterprise AI assistant."},
            {"role": "user", "content": profile["prompt"]}
        ],
        "attribution": {
            "team": profile["team"],
            "feature": profile["feature"],
            "user": profile["user"],
            "environment": "production"
        },
        "max_tokens": random.randint(150, 600),
        "stream": False
    }

    headers = {
        "X-Team": profile["team"],
        "X-Feature": profile["feature"],
        "X-User-ID": profile["user"],
        "X-Environment": "production"
    }

    start = time.perf_counter()
    try:
        res = await client.post(PROXY_URL, json=payload, headers=headers, timeout=15.0)
        dur = round((time.perf_counter() - start) * 1000, 1)
        if res.status_code == 200:
            data = res.json()
            attrib = data.get("attribution", {})
            print(f"[{index:02d}] HTTP 200 | {profile['team']:<16} | {profile['feature']:<20} | {profile['model']:<15} | Cost: ${attrib.get('cost_usd', '0.00'):<10} | {dur}ms")
        else:
            print(f"[{index:02d}] HTTP {res.status_code} | {res.text}")
    except Exception as e:
        print(f"[{index:02d}] Request error: {e}")

async def run_traffic_simulation(batch_size: int = 15):
    print("=" * 80)
    print("  SIMULATING MULTI-TENANT ENTERPRISE LLM TRAFFIC GENERATION")
    print(f"  Target: {PROXY_URL} | Batch: {batch_size} Requests")
    print("=" * 80)

    async with httpx.AsyncClient() as client:
        tasks = []
        for i in range(batch_size):
            profile = random.choice(ENTERPRISE_PROFILES)
            tasks.append(send_single_request(client, profile, i + 1))
            await asyncio.sleep(0.08)  # staggered arrival
        await asyncio.gather(*tasks)

    print("=" * 80)
    print("  TRAFFIC SIMULATION COMPLETED! Check the dashboard to view real-time attribution.")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_traffic_simulation(20))
