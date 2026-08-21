import asyncio
import httpx
import json

async def trigger_multimedia_attack():
    print("Initiating Multimedia Token-Burn Attack...")
    
    # 1. We construct a massive payload with audio and video blocks
    # To simulate heavy Base64, we just create a very long string.
    # We use roughly 5MB of "A"s for video to simulate ~150 frames.
    video_base64 = "A" * (1024 * 1024 * 5)
    # We use ~32KB of "B"s for audio to simulate ~2 seconds.
    audio_base64 = "B" * (1024 * 32)
    
    payload = {
        "model": "gemini-3.5-flash",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this 1 hour video and 3 seconds of audio:"},
                    {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}},
                    {"type": "video_url", "video_url": {"url": f"data:video/mp4;base64,{video_base64}"}},
                    {"type": "audio_url", "audio_url": {"url": f"data:audio/mp3;base64,{audio_base64}"}}
                ]
            }
        ],
        "max_tokens": 1000,
        "user_id": "attacker_bot_02"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Sending massive multimedia payload to Gateway...")
        response = await client.post("http://127.0.0.1:8001/v1/chat/completions", json=payload)
        
        print(f"\nStatus: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
        
        print("\n--- Sending a Legitimate Short Media Request ---")
        
        legit_payload = {
            "model": "gemini-3.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this tiny image:"},
                        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}},
                    ]
                }
            ],
            "max_tokens": 1000,
            "user_id": "legit_user_02"
        }
        
        async with client.stream("POST", "http://127.0.0.1:8001/v1/chat/completions", json=legit_payload) as stream_resp:
            print(f"\nStatus: {stream_resp.status_code}")
            print("Streaming legit response:")
            async for chunk in stream_resp.aiter_text():
                print(chunk, end="", flush=True)

if __name__ == "__main__":
    asyncio.run(trigger_multimedia_attack())
