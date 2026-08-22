# Krypton Active-Defense Gateway & Gemi Chatbot

An **Active-Defense AI Gateway** designed to mitigate token-burn and Denial-of-Wallet (OWASP LLM10) attacks on Generative AI applications, bundled with a fully featured multimodal AI Chatbot (**Gemi**).

---

## 💡 Project Idea & Overview

Generative AI APIs (like OpenAI and Google Gemini) charge per token and per media byte processed. If a malicious user or bot spam-uploads massive 4K videos, heavy audio files, or dense text payloads, it can cause catastrophic financial losses—often termed **Denial-of-Wallet**.

To solve this, we built **Krypton Gateway**: a transparent, zero-latency proxy that sits between your users and the commercial LLM. It intercepts requests, instantly estimates their financial footprint without decoding heavy payloads, and blocks malicious attacks pre-flight (spending $0) while allowing legitimate traffic to pass through seamlessly. 

Coupled with a **Command Center Dashboard** for monitoring global metrics and a fully-functional **Gemi AI Chatbot** client, this repository is a complete ecosystem demonstrating enterprise-grade AI security.

---

## 🚀 Progress So Far (From Scratch)

Here is a chronological log of our implementation progress from scratch:

- **Phase 1: Foundation & Proxy Architecture**
  - Designed the FastAPI backend (`backend/main.py`) to act as a transparent proxy for Google Gemini.
  - Implemented SSE (Server-Sent Events) streaming so responses appear instantly, mimicking production LLM behavior.
- **Phase 2: Security & Token Heuristics (Zero-Latency)**
  - Developed `tokenizer.py` to calculate exact text token counts and extrapolate media volume (Video Frames, Audio Seconds) entirely from Base64 string lengths.
  - Implemented strict static complexity ceilings (e.g., maximum 100 video frames, maximum 4000 tokens per request).
- **Phase 3: Real-Time Telemetry & Threat Dashboard**
  - Built a beautiful AMOLED/Glassmorphism React dashboard frontend.
  - Implemented Live Multi-Currency tracking (e.g., USD, INR, EUR) fetching rates dynamically.
  - Plotted live streaming telemetry, including total requests, cost, and blocked attacks via Recharts.
- **Phase 4: Financial Velocity & Budgeting**
  - Integrated a Redis sliding-window anomaly trap (`redis_client.py`) to catch cost-velocity burst attacks (e.g., max $0.05 spend per minute).
  - Developed `budget.py` to enforce strict daily Micro-Budget ceilings per user identity (e.g., $0.50 daily limits for Freemium users).
  - Wired up MongoDB Atlas (`db.py`) to persist financial burn, threat logs, and daily usage securely.
- **Phase 5: Global Analytics & Company Command Center**
  - Scaled the architecture to support macro-view metrics across the entire organization.
  - Built the `CompanyCommandCenter.jsx` dashboard view to visualize total company token burn, total financial savings (cost averted from blocked attacks), and active tenant limits.
- **Phase 6: Threat Simulation & Resilience Tuning**
  - Developed automated attacker bots (`multimedia_burn_bot.py` and `token_burn_bot.py`) to simulate Denial-of-Wallet attacks.
  - Debugged and hardened the SSE proxy pipeline against upstream LLM read timeouts and raw API error outputs, wrapping them gracefully into the SSE protocol to prevent the Gemi UI from breaking ("stream error" fixes).
- **Phase 7: The Gemi Client**
  - Built a complete Gemini-clone UI (`gemi` React app) capable of sending text, images, video, and audio to the Gateway proxy while maintaining chat history and rendering markdown.

---

## 🛡️ Security Defense Layers

1. **Zero-Latency Pre-Flight Token Heuristics:** Drops payloads exceeding token/frame ceilings instantly pre-flight before sending to the LLM.
2. **Velocity & Anomaly Trap (Redis):** Blocks high-frequency request spam and high-velocity financial burn bursts.
3. **Per-User Micro-Budget Enforcement (MongoDB):** Enforces a hard daily monetary ceiling on each authenticated user, severing access with HTTP 402 once exhausted.

---

## 🛠️ Installation & Setup Guide

To run the entire ecosystem locally, follow these steps:

### 1. Environment Configuration
Create a `.env` file in the root directory (`d:\Scryptic` or your clone directory) and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Start the Krypton Gateway (Backend)
The backend acts as the active-defense proxy. It will default to in-memory modes if you don't have MongoDB or Redis running locally.
Open a terminal at the project root and run:
```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*The gateway will now be active on port `8000`.*

### 3. Start the Threat Dashboard (Command Center)
This React app visualizes attacks and live network flow. Open a **second** terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Navigate to `http://localhost:5173` to view the AMOLED dashboard.*

### 4. Start the Gemi Chatbot Client
The Gemi chatbot is the client UI that your users interact with. Open a **third** terminal window:
```bash
cd gemi
npm install
npm run dev
```
*Navigate to `http://localhost:5174` (or the port specified by Vite) to use the chatbot.*

---

## 🎯 Testing the Defenses

To test if the gateway is working, launch a simulated attack:

Open a **fourth** terminal at the project root and run:
```bash
python attacker/multimedia_burn_bot.py
```
This script will construct a massive, 5MB simulated video payload and send it to the Gateway. You will instantly see the Gateway throw a `400 Bad Request` block, protecting your wallet, and your Dashboard charts will spike to log the deflected threat!
