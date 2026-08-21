import asyncio
import httpx
import json

async def test_fidelity():
    print("Testing Transparent Proxy Fidelity (Tools & Multimodal)...")
    payload = {
        "model": "gemini-3.5-flash",
        "messages": [
            {
                "role": "user",
                "content": "What is the weather in Paris?"
            }
        ],
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "get_current_weather",
                    "description": "Get the current weather in a given location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA",
                            },
                        },
                        "required": ["location"],
                    },
                }
            }
        ],
        "tool_choice": "auto",
        "max_tokens": 500,
        "user_id": "user_freemium_01"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # We use a POST request and print the raw stream
        async with client.stream("POST", "http://127.0.0.1:8000/v1/chat/completions", json=payload) as response:
            print(f"Status: {response.status_code}\n")
            print("--- STREAMING RESPONSE FROM GATEWAY ---")
            async for chunk in response.aiter_text():
                print(chunk, end="", flush=True)
            print("\n--------------------------------------")

if __name__ == "__main__":
    asyncio.run(test_fidelity())
