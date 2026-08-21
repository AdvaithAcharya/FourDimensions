# Krypton Active-Defense Gateway & Gemi Chatbot

An **Active-Defense AI Gateway** designed to mitigate token-burn and Denial-of-Wallet (OWASP LLM10) attacks on Generative AI applications, bundled with a fully featured multimodal AI Chatbot (**Gemi**).

---

## 🚀 Project Overview & Progress

Over the course of this project, we have successfully designed and built a highly resilient, transparent proxy architecture that protects AI endpoints (like Google Gemini) from malicious usage while seamlessly forwarding legitimate requests.

### What We Have Built:
1. **Krypton Gateway (Backend)**: 
   - A Python/FastAPI proxy running on port `8000`.
   - **Zero-Latency Heuristics**: Calculates token complexities and estimates media volumes (Video Frames, Audio Seconds) entirely from Base64 payloads without decoding them, adding almost zero latency overhead.
   - **Threat Interception**: Blocks high-volume payloads (e.g. >100 Video frames) pre-flight to prevent massive financial burns.
   - **Database Logging**: Persists intercepted token burns, attacks, and telemetry straight into MongoDB.

2. **Krypton Dashboard (Frontend)**:
   - An AMOLED/Glassmorphism React application running on port `5173`.
   - Visualizes live streaming telemetry pulled straight from the Gateway.
   - Specifically configured to plot the **dropped/intercepted** multimedia burn metrics in real-time, showing exactly how much malicious data was deflected.

3. **Gemi (Chatbot)**:
   - A full-stack Gemini-clone React application running on port `5174/5175`.
   - Uses **Server-Sent Events (SSE)** to stream AI responses instantly to the screen, exactly like production chatbots.
   - Supports uploading text, images, videos, and audio directly into the prompt.
   - Completely isolated: It doesn't hold the API key. It connects to the Krypton Gateway proxy which injects the API key for it.

---

## 🛠️ Installation & Setup Guide

If you just cloned this repository, follow these steps to get the entire ecosystem running on your machine:

### 1. Set Up Environment Variables
Create a `.env` file in the root directory (`d:\Scryptic`) and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Start the Krypton Gateway (Backend)
The backend requires Python and Uvicorn. It will securely default to high-speed in-memory modes if MongoDB/Redis are not installed locally.
Open a terminal at the project root and run:
```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Start the Threat Dashboard (Frontend)
The dashboard visualizes the attacks and network flow. Open a **second** terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Navigate to `http://localhost:5173` to view the AMOLED dashboard.*

### 4. Start the Gemi Chatbot
The Gemi chatbot is the client UI. Open a **third** terminal window:
```bash
cd gemi
npm install
npm run dev
```
*Navigate to `http://localhost:5174` (or the port specified by Vite) to use the chatbot.*

---

## 🎯 Testing the Defense Mechanisms

To prove the gateway works, you can launch a simulated attack to watch the Gateway intercept it:

Open a **fourth** terminal at the project root and run:
```bash
python attacker/multimedia_burn_bot.py
```
This script will construct a massive, 5MB simulated video payload (which equates to over 150 frames) and attempt to send it to the Gateway. You will instantly see the Gateway throw a `400 Bad Request: OWASP_LLM10_UNBOUNDED_CONSUMPTION` intercept block, and your Dashboard charts will spike to log the blocked media!
