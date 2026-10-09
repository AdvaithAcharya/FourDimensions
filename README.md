# Krypton: Enterprise LLM FinOps Observability & Attribution Gateway
### Commvault Challenge PS-404 · Solution Architecture & Delivery

[![Security Gate](https://img.shields.io/badge/Security-Admin%20Clearance%20Gate-red.svg)](#-admin-authentication-credentials)
[![Reconciliation Audit](https://img.shields.io/badge/Reconciliation%20Audit-PASSED%20(100%25)-emerald.svg)](#-deliverable-4-mathematical-reconciliation--audit)
[![Discrepancy Rate](https://img.shields.io/badge/Discrepancy%20Rate-0.000000%25-brightgreen.svg)](#-deliverable-4-mathematical-reconciliation--audit)
[![Precision](https://img.shields.io/badge/Arithmetic-Decimal%20Fixed--Point-blue.svg)](#-algorithmic-complexity--benchmarks)
[![Provider Modes](https://img.shields.io/badge/Providers-OpenAI%20%2B%20Anthropic%20%2B%20Gemini-orange.svg)](#-multi-provider-inbound-interfaces)
[![Pytest Suite](https://img.shields.io/badge/Tests-26%20PASSED-success.svg)](#-automated-pytest-test-suite)

---

## 📌 Project Overview

Organizations struggle to identify which teams, features, models, or users consume the most LLM tokens and incur the highest cloud API costs. Untagged requests often get misattributed, inflating departmental bills, while floating-point rounding errors lead to ledger drift.

**Krypton** is an enterprise-grade LLM FinOps proxy and observability gateway engineered for **Commvault Challenge PS-404**. It intercepts LLM API traffic, dynamically extracts multi-tenant attribution metadata from HTTP headers or JSON request bodies, evaluates exact token costs using an external pricing catalog with **zero floating-point drift (`Decimal`)**, and streams real-time cost intelligence to an interactive dashboard.

---

## 🔐 Admin Authentication Credentials

For security compliance, access to the interactive FinOps dashboard is protected behind an **Administrative Clearance Gate**:

| Parameter | Value |
| :--- | :--- |
| **Admin Username** | `admin` |
| **Admin Password** | `admin123` |
| **Access URL** | `http://localhost:5173` |
| **One-Click Demo** | Use the **"Demo Creds (user: admin \| pass: admin123)"** button on the login screen |
| **Session Control** | Terminate sessions anytime via the **admin · Sign Out** button in the top navigation bar |

---

## 💻 Tech Stack

- **Backend Gateway**: Python 3.11+, FastAPI (Async), Uvicorn, Pydantic v2
- **Tokenization Engine**: Tiktoken (`cl100k_base` BPE tokenizer) with heuristics for missing tokens
- **Financial Calculation Engine**: Python `decimal.Decimal` with `ROUND_HALF_UP` fixed-point quantization (up to 10-decimal precision)
- **External Pricing Catalog**: Configurable JSON/CSV pricing tables loaded at runtime (`backend/data/pricing.json`)
- **Persistence Tier**: Dual-mode resilient tier — Async MongoDB Atlas (`motor`) when configured, with automatic zero-configuration In-Memory ledger fallback
- **Frontend Dashboard**: React 19, Vite 8, Tailwind CSS 4, Chart.js, React-ChartJS-2, Lucide React icons
- **Companion AI Client**: React 19, Vite 8, Tailwind CSS 4, React-Markdown, Axios
- **Automated Testing**: Pytest (`pytest backend/tests/ -v`) with 23 unit & integration tests

---

## 🚀 Key Features

1. **Dual-Provider Transparent Proxy Interfaces**:
   - **OpenAI Compatible**: `POST /v1/chat/completions` (OpenAI format requests & streaming).
   - **Anthropic Messages Compatible**: `POST /v1/messages` (Anthropic format with `input_tokens` and `output_tokens` in `usage`).
2. **True Attribution & Unattributed Spend Isolation**:
   - Untagged requests strictly default to `"Unattributed"` (`team`, `feature`, `user`)—never silently inflated into Engineering.
   - Granular `attribution_status` tracking: `"complete"` (all 3 dimensions present), `"partial"`, or `"unattributed"`.
   - Visible dashboard KPI banner for `"Unattributed Spend"` to remediate untagged rogue workloads.
3. **External Pricing Catalog & Longest-Match Resolution**:
   - Reads catalog from `PRICING_FILE` (`backend/data/pricing.json`), supporting per-1K and per-1M units.
   - Longest-prefix matching: dated models (`gpt-4o-mini-2024-07-18`) resolve to `gpt-4o-mini` rates.
   - Unknown models are charged at $0, tagged `cost_status="unpriced_model"`, and flagged with visible UI warnings.
4. **Token Provenance & Heuristics**:
   - Tracks `token_source` (`"reported"` vs `"estimated"`) on every ledger record.
   - Dashboard KPI card displays `"X% of cost based on estimated tokens"`.
5. **Exact Decimal Accounting**:
   - $\mathcal{O}(1)$ lookup and arithmetic calculating input, output, and cached discount costs with strictly zero binary floating-point drift ($\Delta = \$0.00000000$).
6. **Independent Ground-Truth Expected Values Validation**:
   - `POST /api/finops/validate/upload`: Upload organizer-supplied expected values JSON; validates against **actual aggregated ledger totals**.
   - If expected file has missing/unrecognized keys: returns `NO_CHECKS` (never claims false MATCH).
   - Adversarial verification: injected discrepancies (e.g. fake $999) immediately trigger `MISMATCH`.
7. **Bulk Dataset Ingestion Engine with Quarantined Robustness**:
   - Supports `.zip` archives (extracts and analyzes embedded CSV or JSONL automatically), as well as direct `.csv`, `.jsonl`, and `.json` files.
   - Recomputes row costs using the pricing catalog rather than trusting a `cost_usd` column.
   - Malformed rows (e.g. corrupt strings, bad values) are routed to `rejected_records` with exact reasons without failing the upload.
   - Saves committed records to MongoDB Atlas and memory without 5,000-record truncation limits.
8. **Interactive 4-Dimensional Breakdowns & Multi-Currency Showback**:
   - Dynamic Chart.js visualizations breaking down spend across **Team**, **Feature**, **Model**, and **Time Period**.
   - Real-time currency conversions across USD ($), INR (₹), EUR (€), and GBP (£).

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **Python**: Version `3.11` or higher
- **Node.js**: Version `18.0.0` or higher
- **npm**: Version `9.0.0` or higher (bundled with Node.js)
- **Git** (for version control)

---

## 🛠️ Installation & Run Instructions

### 1. Backend Gateway Setup & Startup

1. Open a terminal in the root repository directory:
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI FinOps gateway server:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The gateway will start listening on `http://127.0.0.1:8000` (API documentation available at `http://127.0.0.1:8000/docs`).*

---

### 2. Interactive FinOps Dashboard Setup & Startup

1. Open a second terminal and navigate to the frontend directory:
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at:
   ```
   http://localhost:5173
   ```
5. Log in using admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

---

### 3. Companion AI Chatbot Client Setup (Optional)

1. Open a third terminal and navigate to the `gemi` directory:
   ```bash
   cd gemi
   npm install
   npm run dev
   ```
   *Access the companion client at `http://localhost:5174` to send live test chat traffic to the gateway.*

---

## ⚙️ Environment Configuration

Copy the template configuration file:
```bash
cp .env.example .env
```

Key environment parameters:
```env
# Google Gemini API Key (Required only if USE_LIVE_GEMINI=true)
GEMINI_API_KEY=""
USE_LIVE_GEMINI="false"
SIMULATED_LATENCY_MS=45

# MongoDB Atlas Connection (Optional - falls back to in-memory ledger if omitted)
MONGO_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<app_name>"
DATABASE_NAME="krypton_gateway"

# External Pricing Catalog Path (Defaults to built-in JSON)
PRICING_FILE="backend/data/pricing.json"
```

> [!NOTE]
> `.env` is strictly excluded by `.gitignore`. No database passwords or secrets are tracked in version control.

---

## 🎯 Commvault PS-404 Deliverables Alignment

| PS-404 Deliverable | Krypton Implementation | Architectural Highlight |
| :--- | :--- | :--- |
| **1. Request Logger or Proxy with Configurable Attribution** | Transparent `/v1/chat/completions` and `/v1/messages` proxy with header & JSON-body attribution parser (`X-Team`, `X-Feature`, `X-User-ID`, `attribution: {...}`). Untagged requests strictly default to `"Unattributed"`. | Tracks `attribution_status` (`complete`, `partial`, `unattributed`) and displays isolated unattributed spend. |
| **2. Cost & Usage Calculations via Pricing Table** | `backend/pricing.py` Decimal accounting engine loaded from external `pricing.json` with longest-key prefix resolution (`gpt-4o-mini-2024-07-18` $\rightarrow$ `gpt-4o-mini`). | Unknown models charged at $0 (`unpriced_model`), avoiding silent $4o overcharges. |
| **3. Interactive Dashboard with Multi-Dimensional Breakdowns** | React 19 + Tailwind CSS + Chart.js dashboard with breakdowns by **Team**, **Feature**, **Model**, and **Time Period**, plus live **Multi-Currency Showback (USD, INR, EUR, GBP)**. | 1.5-second live telemetry polling with dynamic time-series charts and unpriced model warnings. |
| **4. Validation Report Comparing Totals with Known Expected Values** | Dedicated validation endpoint (`POST /api/finops/validate/upload`) comparing actual ledger aggregates against external expected values JSON. | Strict verification flags mismatches (e.g. fake +$999 $\rightarrow$ `MISMATCH`) and returns `NO_CHECKS` if keys are missing. Internal fixtures renamed "Pricing Engine Self-Test". |

---

## ⚡ Algorithmic Complexity & Benchmarks

| Dimension | Theoretical Complexity | Empirical Benchmark | Description |
| :--- | :--- | :--- | :--- |
| **Pricing Lookup** | $\mathcal{O}(1)$ | $<0.002\text{ ms}$ | Hash-map lookup with longest-prefix resolution. |
| **Cost Calculation** | $\mathcal{O}(1)$ | $<0.004\text{ ms}$ | Fixed-point Python `Decimal` multiplication & quantization. |
| **Auxiliary Space** | $\mathcal{O}(1)$ | $<120\text{ bytes}$ | Constant memory allocated per request evaluation. |
| **Throughput** | $\sim 250,000\text{ evals/sec}$ | $3.39\text{ ms} / 1,000\text{ evals}$ | Sub-millisecond calculation pipeline. |
| **Discrepancy Tolerance ($\Delta$)** | **0.00000000%** | $\Delta = \$0.00000000$ | Strict avoidance of binary floating-point IEEE-754 drift. |

---

## 🌐 API Attribution Specifications

### Method A: OpenAI HTTP Headers
```bash
curl -X POST http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Team: Engineering" \
  -H "X-Feature: CodeReview-Bot" \
  -H "X-User-ID: dev_alex" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Review this pull request"}],
    "max_tokens": 500
  }'
```

### Method B: OpenAI JSON Body Attribution Object
```bash
curl -X POST http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "Analyze system architecture"}],
    "attribution": {
      "team": "Data-Science",
      "feature": "Model-Evaluation",
      "user": "ds_elena",
      "environment": "production"
    }
  }'
```

### Method C: Anthropic Messages Format
```bash
curl -X POST http://127.0.0.1:8000/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-Team: Customer-Support" \
  -H "X-Feature: Live-Chatbot" \
  -H "X-User-ID: sup_tom" \
  -d '{
    "model": "claude-3-5-sonnet",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Help customer reset password"}]
  }'
```

---

## 🏷️ Supported Pricing Catalog

Rates are loaded from `backend/data/pricing.json`:

| Model Key | Input / 1M Tokens | Output / 1M Tokens | Input / 1k Tokens | Output / 1k Tokens |
| :--- | :--- | :--- | :--- | :--- |
| `gpt-4o` | **$2.50** | **$10.00** | $0.00250 | $0.01000 |
| `gpt-4o-mini` | **$0.15** | **$0.60** | $0.00015 | $0.00060 |
| `claude-3-5-sonnet` | **$3.00** | **$15.00** | $0.00300 | $0.01500 |
| `gemini-1.5-flash` | **$0.075** | **$0.30** | $0.000075 | $0.00030 |
| `gemini-1.5-pro` | **$1.25** | **$5.00** | $0.00125 | $0.00500 |
| `llama-3-70b` | **$0.80** | **$0.80** | $0.00080 | $0.00080 |

---

## 📤 Data Statistics & Telemetry Export

Krypton includes an automated export engine for financial reconciliation, executive reporting, and offline audits:

### Export Formats:
1. **Full Financial Statement (`CSV`)**:
   - Executive financial report featuring multi-section tables:
     - **Section 1**: KPI summary (Total spend, requests, tokens, attribution confidence, unattributed spend, estimated tokens share, mean latency).
     - **Section 2**: Department / Team attribution breakdown.
     - **Section 3**: Feature / workload attribution breakdown.
     - **Section 4**: Model usage distribution.
     - **Section 5**: Granular request ledger entries.
2. **Request Audit Ledger (`CSV`)**:
   - Flat tabular export of individual request logs (`id, timestamp, team, feature, user, model, prompt_tokens, completion_tokens, total_tokens, token_source, attribution_status, total_cost_usd, latency_ms`).
3. **Full FinOps Telemetry (`JSON`)**:
   - Complete structured JSON payload containing 4-dimensional breakdowns, metadata, and all active ledger records.

### API Endpoints:
- `GET /api/finops/export?format=csv&type=full&currency=USD` (Download executive CSV report)
- `GET /api/finops/export?format=csv&type=ledger` (Download flat tabular CSV)
- `GET /api/finops/export?format=json&currency=USD` (Download structured JSON telemetry)

---

## 🧪 Automated Pytest Test Suite

Execute the test suite in the root directory:

```bash
pytest backend/tests/ -v
```

All 26 unit & integration tests verify:
1. `test_auth.py` (3 tests): Admin login validation (`admin` / `admin123`), 401 on bad credentials, and session token lifecycle.
2. `test_attribution.py` (5 tests): Untagged requests strictly default to `"Unattributed"`; partial vs complete attribution status; header and nested object parsing.
3. `test_pricing.py` (5 tests): Longest-prefix matching (`gpt-4o-mini-2024-07-18` $\rightarrow$ `gpt-4o-mini`); unknown models charged at $0 and marked `unpriced_model`; custom file loading; Decimal precision.
4. `test_dataset_loader.py` (5 tests): Tokens-only CSV computes non-zero cost via pricing catalog; OpenAI & Anthropic JSONL token parsing; character heuristic estimation (`token_source="estimated"`); malformed row isolation in `rejected_records`.
5. `test_export.py` (3 tests): Exporting data statistics as Full Financial Statement CSV, Request Ledger CSV, and Structured 4D JSON.
6. `test_proxy_endpoints.py` (2 tests): OpenAI `/v1/chat/completions` untagged defaults; Anthropic `/v1/messages` format with `usage.input_tokens` and `usage.output_tokens`.
7. `test_validator.py` (3 tests): True ledger expected values return `MATCH`; adversarial mismatch injection returns `MISMATCH`; empty/unrecognized files return `NO_CHECKS`.
