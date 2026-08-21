import asyncio
import httpx

async def send_good_request():
    print("Sending a valid request to Krypton Gateway...")
    payload = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "In one short sentence, what is Krypton?"}],
        "max_tokens": 100,
        "user_id": "good_user_01"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # We use a POST request and print the raw stream
        async with client.stream("POST", "http://127.0.0.1:8000/v1/chat/completions", json=payload) as response:
            print(f"Status: {response.status_code}\n")
            print("--- STREAMING RESPONSE FROM GEMINI ---")
            async for chunk in response.aiter_text():
                print(chunk, end="", flush=True)
            print("\n--------------------------------------")

if __name__ == "__main__":
    asyncio.run(send_good_request())
