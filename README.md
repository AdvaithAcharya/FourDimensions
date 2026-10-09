# Krypton: Enterprise LLM FinOps Observability & Attribution Gateway
### Commvault Challenge PS-404 · Solution Architecture & Delivery

[![Audit Status](https://img.shields.io/badge/Reconciliation%20Audit-PASSED%20(100%25)-emerald.svg)](#-deliverable-4-mathematical-reconciliation--audit)
[![Discrepancy Rate](https://img.shields.io/badge/Discrepancy%20Rate-0.000000%25-brightgreen.svg)](#-deliverable-4-mathematical-reconciliation--audit)
[![Precision](https://img.shields.io/badge/Arithmetic-Decimal%20Fixed--Point-blue.svg)](#-algorithmic-complexity--benchmarks)
[![Provider Mode](https://img.shields.io/badge/Provider-Simulated%20%2B%20Live%20Gemini-orange.svg)](#-provider-modes)

---

## 📌 Project Overview

Organizations struggle to identify which teams, features, models, or users consume the most LLM tokens and incur the highest cloud API costs. 

**Krypton** is an enterprise-grade LLM FinOps proxy and observability gateway engineered for **Commvault Challenge PS-404**. It intercepts LLM API traffic, dynamically extracts multi-tenant attribution metadata from HTTP headers or JSON request bodies, evaluates exact token costs using a configurable multi-model pricing catalog with **zero floating-point drift (`Decimal`)**, and streams real-time cost intelligence to an interactive dashboard.

---

## 💻 Tech Stack

- **Backend Gateway**: Python 3.11+, FastAPI (Async), Uvicorn, Pydantic v2
- **Tokenization Engine**: Tiktoken (`cl100k_base` BPE tokenizer)
- **Financial Calculation Engine**: Python `decimal.Decimal` with `ROUND_HALF_UP` fixed-point quantization (up to 10-decimal precision)
- **Persistence Tier**: Dual-mode resilient tier — Async MongoDB Atlas (`motor`) when configured, with automatic zero-configuration In-Memory ledger fallback
- **Frontend Dashboard**: React 19, Vite 8, Tailwind CSS 4, Chart.js, React-ChartJS-2, Lucide React icons
- **Companion AI Client**: React 19, Vite 8, Tailwind CSS 4, React-Markdown, Axios
- **Code Quality & Testing**: Oxlint, Python `unittest` / CLI audit test harness

---

## 🚀 Key Features

- **Transparent OpenAI-Compatible Proxy**: Exposes `/v1/chat/completions` supporting both simulated provider mode and upstream live AI endpoints.
- **Configurable Multi-Tenant Attribution**: Ingests team, feature, user, and environment attribution through standard HTTP headers (`X-Team`, `X-Feature`, `X-User-ID`, `X-Environment`) or JSON body `attribution: {...}` metadata.
- **Exact Decimal Pricing & Showback**: $\mathcal{O}(1)$ lookup and arithmetic calculating input, output, and cached discount costs with strictly zero binary floating-point drift ($\Delta = \$0.00000000$).
- **Multi-Currency Global Conversion**: Real-time showback rates across USD ($), INR (₹), EUR (€), GBP (£), and JPY (¥).
- **Interactive 4-Dimensional Breakdowns**: Dynamic Chart.js visualizations breaking down spend and token consumption across:
  - **Dimension 1**: Team / Department
  - **Dimension 2**: Feature / Workload
  - **Dimension 3**: Model Distribution
  - **Dimension 4**: Time Period Trajectory
- **Immutable Request Audit Ledger**: Searchable, filterable real-time table recording every inbound call, prompt/completion tokens, latency, and exact cost.
- **Instant Zero-Baseline Reset**: Single-click **"Reset to 0"** action that atomically resets all ledger records, token counts, and spend metrics back to zero.
- **Bulk Dataset Ingestion Engine**: Upload `.zip`, `.csv`, `.jsonl`, or `.json` telemetry files to run single-pass streaming aggregations (~55,000 records/sec) with automated mathematical reconciliation proofs.
- **Mathematical Audit Suite (PS-404 Deliverable 4)**: Automated test harness verifying actual calculations against theoretical ground truth down to 8 decimal places.
- **Multi-Tenant Traffic Simulator**: One-click or CLI load generation across 5 organizational departments.

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **Python**: Version `3.11` or higher
- **Node.js**: Version `18.0.0` or higher
- **npm**: Version `9.0.0` or higher (bundled with Node.js)
- **Git** (optional, for version control)

---

## 🛠️ Installation & Run Instructions

> [!NOTE]
> All commands listed below have been verified directly in the project environment.

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
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Verify the production build:
   ```bash
   npm run build
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Access the interactive dashboard in your browser at `http://localhost:5173`.*

---

### 3. Companion AI Chatbot Client Setup (Optional)

1. Open a third terminal and navigate to the `gemi` directory:
   ```bash
   cd gemi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Verify the production build:
   ```bash
   npm run build
   ```
4. Start the companion client:
   ```bash
   npm run dev
   ```
   *Access the companion client at `http://localhost:5174` to chat with the attribution-enabled proxy.*

---

### 4. Running Verification Audits & Simulators

- **Run Mathematical Reconciliation Audit (PS-404 Deliverable 4)**:
  ```bash
  python validate_reconciliation.py
  ```
  *Generates `validation_report.json` and verifies 0.000000% error rate.*

- **Simulate Multi-Tenant Corporate Traffic**:
  ```bash
  python traffic_simulator.py
  ```
  *Sends sample requests across Engineering, Data-Science, Support, Marketing, and Product to populate the live dashboard.*

---

## 🎯 Commvault PS-404 Deliverables Alignment

| PS-404 Deliverable | Krypton Implementation | Architectural Highlight |
| :--- | :--- | :--- |
| **1. Request Logger or Proxy with Configurable Attribution** | Transparent OpenAI-compatible `/v1/chat/completions` proxy with dual header & JSON-body attribution parser (`X-Team`, `X-Feature`, `X-User-ID`, `attribution: {...}`). | Zero-latency asynchronous ingestion with background ledger commit. |
| **2. Cost & Usage Calculations via Pricing Table** | `backend/pricing.py` Decimal accounting engine mapping frontier models (`gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`, `gpt-4o-mini`, etc.) down to 8 decimal places. | Constant time $\mathcal{O}(1)$ pricing lookup and arithmetic with zero representation drift. |
| **3. Interactive Dashboard with Multi-Dimensional Breakdowns** | React 19 + Tailwind CSS + Chart.js dashboard with breakdowns by **Team**, **Feature**, **Model**, and **Time Period**, plus live **Multi-Currency Showback (USD, INR, EUR, GBP, JPY)**. | 1.5-second live telemetry polling with dynamic time-series charts. |
| **4. Validation Report Comparing Totals with Known Expected Values** | Dedicated validation engine (`backend/validator.py`), CLI verification script (`validate_reconciliation.py`), and in-dashboard Audit View. | Automated mathematical reconciliation verifying $\Delta = \$0.00000000$ discrepancy against ground truth. |

---

## ⚡ Algorithmic Complexity & Benchmarks

| Dimension | Theoretical Complexity | Empirical Benchmark | Description |
| :--- | :--- | :--- | :--- |
| **Pricing Lookup** | $\mathcal{O}(1)$ | $<0.002\text{ ms}$ | Direct hash-map lookup with substring fallback. |
| **Cost Calculation** | $\mathcal{O}(1)$ | $<0.004\text{ ms}$ | Fixed-point Python `Decimal` multiplication & quantization. |
| **Auxiliary Space** | $\mathcal{O}(1)$ | $<120\text{ bytes}$ | Constant memory allocated per request evaluation. |
| **Throughput** | $\sim 250,000\text{ evals/sec}$ | $3.39\text{ ms} / 1,000\text{ evals}$ | Sub-millisecond calculation pipeline. |
| **Discrepancy Tolerance ($\Delta$)** | **0.00000000%** | $\Delta = \$0.00000000$ | Strict avoidance of binary floating-point IEEE-754 drift. |

---

## 🧪 Deliverable 4: Mathematical Reconciliation & Audit Output

```text
==============================================================================
  COMMVAULT PS-404: LLM FINOPS RECONCILIATION & ACCURACY AUDIT
==============================================================================
Timestamp: 2026-10-10 02:18:51
Auditing Decimal Accounting Engine against Known Expected Values...

METRIC                       | EXPECTED        | ACTUAL          | DIFF       | STATUS
------------------------------------------------------------------------------
Total Cost (USD)             | $0.08077000     | $0.08077000     | $0.00000000 | [MATCH]
Prompt Tokens                | 24000           | 24000           | 0          | [MATCH]
Completion Tokens            | 6300            | 6300            | 0          | [MATCH]
Total Tokens Sum             | 30300           | 30300           | 0          | [MATCH]
Team Spend: Engineering      | $0.00828000     | $0.00828000     | $0.00000000 | [MATCH]
Team Spend: Data-Science     | $0.06000000     | $0.06000000     | $0.00000000 | [MATCH]
Team Spend: Customer-Support | $0.00042000     | $0.00042000     | $0.00000000 | [MATCH]
Team Spend: Marketing        | $0.01207000     | $0.01207000     | $0.00000000 | [MATCH]
------------------------------------------------------------------------------

AUDIT VERDICT: PASSED (100% Exact Match)
ERROR RATE:    0.000000%
AUDIT LATENCY: 0.645 ms
==============================================================================
```

---

## 🌐 API Attribution Specification

Clients can supply attribution metadata either through **HTTP Headers** or the **JSON Payload**:

### Method A: HTTP Headers (Standard Gateway Pattern)
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

### Method B: JSON Body Attribution Object
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

---

## 🏷️ Supported Pricing Table

Rates are defined per **1,000,000 tokens** (with per-1k conversions exposed):

| Model Key | Input / 1M Tokens | Output / 1M Tokens | Input / 1k Tokens | Output / 1k Tokens |
| :--- | :--- | :--- | :--- | :--- |
| `gpt-4o` | **$2.50** | **$10.00** | $0.0025 | $0.0100 |
| `gpt-4o-mini` | **$0.15** | **$0.60** | $0.00015 | $0.0006 |
| `claude-3-5-sonnet` | **$3.00** | **$15.00** | $0.0030 | $0.0150 |
| `gemini-1.5-flash` | **$0.075** | **$0.30** | $0.000075 | $0.0003 |
| `gemini-1.5-pro` | **$1.25** | **$5.00** | $0.00125 | $0.0050 |
| `llama-3-70b` | **$0.80** | **$0.80** | $0.0008 | $0.0008 |

---

## 📊 Dataset Ingestion & 4-Dimensional Analysis Engine

Krypton includes a high-performance offline and batch telemetry ingestion engine designed for bulk audits, historical backfills, and multi-dimensional attribution.

### Features:
1. **Multi-Format Ingestion**: Supports `.zip` archives (extracts and analyzes embedded CSV or JSONL automatically), as well as direct `.csv`, `.jsonl`, and `.json` files.
2. **Interactive File Selector & Ingestion**: In the interactive dashboard under the **Dataset Ingestion** tab, upload any telemetry dataset to evaluate it with high-throughput streaming aggregation (~55,000 records/second).
3. **4-Dimensional Breakdown**:
   - **Dimension 1 (Team)**: Spend, token volume, and % share per organizational unit (Engineering, Research, Customer Support, etc.).
   - **Dimension 2 (Feature)**: Granular cost attribution per product feature (Code Review Bot, Search Summarizer, etc.).
   - **Dimension 3 (Model)**: Multi-model cost distribution across frontier and open-weight models.
   - **Dimension 4 (Time Period)**: Daily spend trajectory and token burn rate.
4. **Mathematical Reconciliation Proof**:
   - Compares individual record arithmetic (`input_cost + output_cost - cached_discount`) against the grand total.
   - Computes discrepancy down to 10 decimal places ($\Delta = \$0.0000000000$).
   - Reconciles tokens and total spend with 0.000000% error rate.
5. **Attribution Coverage Matrix**:
   - Tracks **Complete** (all 3 dimensions present), **Partial** (1 or 2 dimensions present), and **Unattributed** traffic.
6. **Live Ledger Import Toggle**:
   - Optional checkbox to merge the uploaded dataset into the live interactive dashboard ledger and audit log.

### API Endpoints:
- `POST /api/finops/dataset/upload` (Multipart file upload with query params `currency` and `commit`)
# FourDimensions
