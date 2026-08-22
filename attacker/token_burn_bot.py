import asyncio
import httpx
import time
import sys

GATEWAY_URL = "http://127.0.0.1:8000/v1/chat/completions"

async def simulate_payload_complexity_attack():
    """Attack 1: Massive context bloat payload attack (OWASP LLM10 Token Burn)"""
    print("\n" + "="*70)
    print("[ATTACK VEC 1] OVERSIZED TOKEN COMPLEXITY BLOAT (50,000+ TOKENS)")
    print("="*70)
    
    # 50,000 repeating words to guarantee exceeding the pre-flight complexity threshold
    huge_prompt = "INSTRUCTION: Explain quantum mechanics in detail. " + ("repeat token burn payload " * 10000)
    
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "user", "content": huge_prompt}
        ],
        "max_tokens": 4000,
        "user_id": "attacker_bot_01"
    }

    start = time.time()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post("http://127.0.0.1:8000/v1/chat/completions", json=payload)
            elapsed_ms = (time.time() - start) * 1000
            print(f"Gateway HTTP Response Status: {response.status_code}")
            print(f"Pre-Flight Interception Latency: {elapsed_ms:.2f} ms")
            print("Response Data:")
            print(response.json())
            if response.status_code == 400:
                print("\n[SUCCESS] Krypton Gateway dropped token-burn payload pre-flight! ($0 spent)")
            else:
                print("\n[FAILED] Request passed through!")
        except Exception as e:
            print(f"Error communicating with gateway: {e}")

async def simulate_velocity_anomaly_attack():
    """Attack 2: High-frequency rapid fire burst attack (Denial-of-Wallet FDoS)"""
    print("\n" + "="*70)
    print("[ATTACK VEC 2] HIGH-FREQUENCY COST VELOCITY BURST (25 REQS/SEC)")
    print("="*70)
    
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "user", "content": "Quick query: calculate 2 + 2"}
        ],
        "max_tokens": 500,
        "user_id": "botnet_cluster_alpha"
    }

    success_count = 0
    blocked_count = 0

    async with httpx.AsyncClient(timeout=5.0) as client:
        tasks = []
        for i in range(25):
            tasks.append(client.post(GATEWAY_URL, json=payload))
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in responses:
            if isinstance(res, httpx.Response):
                if res.status_code == 200:
                    success_count += 1
                elif res.status_code in [429, 400, 402]:
                    blocked_count += 1

    print(f"Attack Results: {success_count} Passed | {blocked_count} Blocked by Anomaly Trap")
    if blocked_count > 0:
        print("[SUCCESS] Anomaly Trap triggered! High-frequency velocity burst intercepted.")

async def simulate_budget_exhaustion_attack():
    """Attack 3: Micro-budget limit exhaustion per user account"""
    print("\n" + "="*70)
    print("[ATTACK VEC 3] USER MICRO-BUDGET EXHAUSTION ATTACK")
    print("="*70)
    
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "user", "content": "Please write a comprehensive 2000 word report on energy storage."}
        ],
        "max_tokens": 4000,
        "user_id": "user_freemium_01"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt in range(1, 6):
            res = await client.post(GATEWAY_URL, json=payload)
            print(f"Attempt #{attempt} -> Status: {res.status_code}")
            if res.status_code in [402, 429]:
                print(f"[SUCCESS] Daily Micro-Budget Ceiling enforced on attempt #{attempt}!")
                print(res.json())
                break
            await asyncio.sleep(0.1)

async def run_all_simulations():
    print("\n" + "="*70)
    print("  KRYPTON GATEWAY EXPLOIT & DEFENSE TEST SUITE  ")
    print("="*70)
    await simulate_payload_complexity_attack()
    await simulate_velocity_anomaly_attack()
    await simulate_budget_exhaustion_attack()
    print("\n" + "="*70)
    print("  ALL EXPLOIT SIMULATIONS COMPLETE!  ")
    print("="*70)

if __name__ == "__main__":
    asyncio.run(run_all_simulations())
