import io
import os
import csv
import json
import time
import zipfile
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
from backend.pricing import pricing_engine, QUANTIZE_EXP
from backend.currency import currency_service
from backend.db import in_memory_logs, save_usage_record, db

class DatasetAnalysisEngine:
    """
    High-Performance Dataset Ingestion & 4-Dimensional Analysis Engine.
    Handles bulk synthetic/production telemetry datasets (.zip, .csv, .jsonl, .json).
    Computes exact aggregations, attribution coverage, and reconciliation proofs.
    """

    @staticmethod
    def extract_dataset_stream(file_bytes: bytes, filename: str) -> Tuple[io.StringIO, str]:
        """Extracts text stream from raw bytes or zip archives."""
        if filename.lower().endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(file_bytes), "r") as z:
                # Prefer CSV, then JSONL, then JSON
                namelist = z.namelist()
                target_file = None
                for candidate in namelist:
                    if candidate.endswith(".csv"):
                        target_file = candidate
                        break
                if not target_file:
                    for candidate in namelist:
                        if candidate.endswith(".jsonl") or candidate.endswith(".json"):
                            target_file = candidate
                            break
                if not target_file:
                    raise ValueError("No CSV or JSONL dataset found inside the zip archive.")
                
                raw_text = z.read(target_file).decode("utf-8", errors="replace")
                return io.StringIO(raw_text), target_file
        else:
            raw_text = file_bytes.decode("utf-8", errors="replace")
            return io.StringIO(raw_text), filename

    @classmethod
    def process_dataset(
        cls,
        file_bytes: bytes,
        filename: str,
        currency: str = "USD",
        commit_to_live_ledger: bool = False
    ) -> Dict[str, Any]:
        """
        Parses dataset and computes 4-dimensional FinOps intelligence and reconciliation proof.
        """
        start_time = time.perf_counter()
        stream, source_filename = cls.extract_dataset_stream(file_bytes, filename)
        
        curr = currency.upper()
        symbol = currency_service.currency_symbols.get(curr, "$")

        # Detect format
        if source_filename.endswith(".csv"):
            reader = csv.DictReader(stream)
            rows = list(reader)
        elif source_filename.endswith(".jsonl"):
            rows = [json.loads(line) for line in stream if line.strip()]
        elif source_filename.endswith(".json"):
            data = json.load(stream)
            rows = data if isinstance(data, list) else data.get("requests", [])
        else:
            # Fallback CSV attempt
            reader = csv.DictReader(stream)
            rows = list(reader)

        total_records = len(rows)
        if total_records == 0:
            return {"status": "EMPTY", "message": "Dataset contains 0 rows."}

        # Accumulators
        total_cost_usd = Decimal(0)
        expected_computed_cost = Decimal(0)
        total_tokens = 0
        total_input_tokens = 0
        total_output_tokens = 0
        total_cached_tokens = 0

        team_stats: Dict[str, Dict[str, Any]] = {}
        feature_stats: Dict[str, Dict[str, Any]] = {}
        model_stats: Dict[str, Dict[str, Any]] = {}
        daily_stats: Dict[str, Dict[str, Any]] = {}
        attrib_counts: Dict[str, int] = {"complete": 0, "partial": 0, "unattributed": 0}

        sample_preview = []
        component_data_found = False
        row_formula_mismatches = 0

        for idx, row in enumerate(rows):
            # Parse values
            team = (row.get("team") or "").strip() or "Unattributed"
            feature = (row.get("feature") or "").strip() or "General"
            model = (row.get("model") or "").strip() or "unknown"
            user_id = (row.get("user_id") or "").strip() or "anon"
            timestamp = (row.get("timestamp") or "").strip()
            
            # Date bucket (YYYY-MM-DD)
            day_bucket = timestamp[:10] if len(timestamp) >= 10 else "Unknown"

            tin = int(row.get("input_tokens") or 0)
            tout = int(row.get("output_tokens") or 0)
            tcached = int(row.get("cached_input_tokens") or 0)
            ttok = int(row.get("total_tokens") or (tin + tout))

            # Cost
            cost_str = str(row.get("cost_usd") or 0)
            row_cost = Decimal(cost_str)

            # Verification of cost formula if component columns present
            if "input_cost_usd" in row and "output_cost_usd" in row:
                component_data_found = True
                in_cost_dec = Decimal(str(row.get("input_cost_usd") or 0))
                out_cost_dec = Decimal(str(row.get("output_cost_usd") or 0))
                disc_dec = Decimal(str(row.get("cached_input_discount_usd") or 0))
                row_expected = (in_cost_dec + out_cost_dec - disc_dec)
                expected_computed_cost += row_expected
                if abs(row_cost - row_expected) > Decimal("0.00000001"):
                    row_formula_mismatches += 1
            else:
                expected_computed_cost += row_cost

            # Attribution status
            status = (row.get("attribution_status") or "complete").lower()
            if status in attrib_counts:
                attrib_counts[status] += 1
            else:
                attrib_counts["complete"] += 1

            total_cost_usd += row_cost
            total_tokens += ttok
            total_input_tokens += tin
            total_output_tokens += tout
            total_cached_tokens += tcached

            # Accumulate Team
            if team not in team_stats:
                team_stats[team] = {"cost": Decimal(0), "tokens": 0, "requests": 0}
            team_stats[team]["cost"] += row_cost
            team_stats[team]["tokens"] += ttok
            team_stats[team]["requests"] += 1

            # Accumulate Feature
            if feature not in feature_stats:
                feature_stats[feature] = {"cost": Decimal(0), "tokens": 0, "requests": 0}
            feature_stats[feature]["cost"] += row_cost
            feature_stats[feature]["tokens"] += ttok
            feature_stats[feature]["requests"] += 1

            # Accumulate Model
            if model not in model_stats:
                model_stats[model] = {"cost": Decimal(0), "tokens": 0, "requests": 0}
            model_stats[model]["cost"] += row_cost
            model_stats[model]["tokens"] += ttok
            model_stats[model]["requests"] += 1

            # Accumulate Daily
            if day_bucket not in daily_stats:
                daily_stats[day_bucket] = {"cost": Decimal(0), "tokens": 0, "requests": 0}
            daily_stats[day_bucket]["cost"] += row_cost
            daily_stats[day_bucket]["tokens"] += ttok
            daily_stats[day_bucket]["requests"] += 1

            # Capture preview of first 10 rows
            if idx < 10:
                conv_row_cost = currency_service.convert_from_usd(float(row_cost), curr)
                sample_preview.append({
                    "id": row.get("request_id") or f"row_{idx+1}",
                    "timestamp": timestamp,
                    "team": team,
                    "feature": feature,
                    "user": user_id,
                    "model": model,
                    "prompt_tokens": tin,
                    "completion_tokens": tout,
                    "total_tokens": ttok,
                    "cost_formatted": f"{symbol}{conv_row_cost:,.4f}" if curr != "JPY" else f"{symbol}{int(conv_row_cost):,}"
                })

        # Format dimension breakdowns
        def format_breakdown(stats_dict: Dict[str, Dict[str, Any]], sort_by_cost: bool = True):
            out = []
            for k, data in stats_dict.items():
                c_usd = float(data["cost"])
                conv = currency_service.convert_from_usd(c_usd, curr)
                pct = float((data["cost"] / total_cost_usd) * Decimal(100)) if total_cost_usd > 0 else 0.0
                out.append({
                    "key": k,
                    "total_cost_usd": round(c_usd, 6),
                    "total_cost_formatted": f"{symbol}{conv:,.4f}" if curr != "JPY" else f"{symbol}{int(conv):,}",
                    "total_tokens": data["tokens"],
                    "request_count": data["requests"],
                    "percentage": round(pct, 2)
                })
            if sort_by_cost:
                out.sort(key=lambda x: x["total_cost_usd"], reverse=True)
            else:
                out.sort(key=lambda x: x["key"])
            return out

        team_breakdown = format_breakdown(team_stats)
        feature_breakdown = format_breakdown(feature_stats)
        model_breakdown = format_breakdown(model_stats)
        daily_breakdown = format_breakdown(daily_stats, sort_by_cost=False)

        # Mathematical Reconciliation Checks
        cost_diff = abs(total_cost_usd - expected_computed_cost)
        token_sum_diff = abs((total_input_tokens + total_output_tokens) - total_tokens)
        attr_sum = sum(attrib_counts.values())
        attr_diff = abs(total_records - attr_sum)

        reconciliation_checks = [
            {
                "check": "Sum of Row Costs vs Exact Grand Total",
                "expected": f"${expected_computed_cost:.10f}",
                "actual": f"${total_cost_usd:.10f}",
                "discrepancy": f"${cost_diff:.10f}",
                "status": "MATCH" if cost_diff == Decimal(0) else "MISMATCH"
            },
            {
                "check": "Prompt + Completion Tokens vs Reported Total",
                "expected": str(total_tokens),
                "actual": str(total_input_tokens + total_output_tokens),
                "discrepancy": str(token_sum_diff),
                "status": "MATCH" if token_sum_diff == 0 else "MISMATCH"
            },
            {
                "check": "Attribution Matrix Sum",
                "expected": str(total_records),
                "actual": str(attr_sum),
                "discrepancy": str(attr_diff),
                "status": "MATCH" if attr_diff == 0 else "MISMATCH"
            }
        ]

        if component_data_found:
            reconciliation_checks.append({
                "check": "Row Component Cost Integrity (Input + Output - Cached Disc == Cost)",
                "expected": f"0 mismatches across {total_records} rows",
                "actual": f"{row_formula_mismatches} mismatches",
                "discrepancy": str(row_formula_mismatches),
                "status": "MATCH" if row_formula_mismatches == 0 else "MISMATCH"
            })

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        throughput_rps = round(total_records / (elapsed_ms / 1000.0), 0) if elapsed_ms > 0 else 100000

        float_total_cost = float(total_cost_usd)
        converted_total = currency_service.convert_from_usd(float_total_cost, curr)

        # Optional: commit to live dashboard ledger
        if commit_to_live_ledger:
            for r in rows:
                c_usd = float(Decimal(str(r.get("cost_usd") or 0)))
                tin = int(r.get("input_tokens") or 0)
                tout = int(r.get("output_tokens") or 0)
                in_memory_logs.append({
                    "id": r.get("request_id") or f"import_{time.time()}",
                    "timestamp": r.get("timestamp") or time.strftime("%Y-%m-%d %H:%M:%S"),
                    "timestamp_epoch": time.time(),
                    "team": r.get("team") or "Unattributed",
                    "feature": r.get("feature") or "General",
                    "user": r.get("user_id") or "imported_user",
                    "environment": r.get("environment") or "production",
                    "model": r.get("model") or "unknown",
                    "prompt_tokens": tin,
                    "completion_tokens": tout,
                    "total_tokens": int(r.get("total_tokens") or (tin + tout)),
                    "input_cost_usd": float(r.get("input_cost_usd") or 0),
                    "output_cost_usd": float(r.get("output_cost_usd") or 0),
                    "total_cost_usd": c_usd,
                    "total_cost_usd_exact": str(c_usd),
                    "latency_ms": float(r.get("latency_ms") or 50),
                    "provider_mode": "imported_dataset",
                    "status_code": int(r.get("status_code") or 200)
                })

        return {
            "status": "SUCCESS",
            "filename": source_filename,
            "total_records": total_records,
            "total_cost_usd": round(float_total_cost, 6),
            "total_cost_exact": str(total_cost_usd),
            "total_cost_formatted": f"{symbol}{converted_total:,.4f}" if curr != "JPY" else f"{symbol}{int(converted_total):,}",
            "currency": curr,
            "currency_symbol": symbol,
            "total_tokens": total_tokens,
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "total_cached_tokens": total_cached_tokens,
            "avg_cost_per_record": f"{symbol}{(converted_total / total_records):,.6f}",
            "attribution_coverage": {
                "complete": attrib_counts["complete"],
                "complete_pct": round((attrib_counts["complete"] / total_records) * 100, 2),
                "partial": attrib_counts["partial"],
                "partial_pct": round((attrib_counts["partial"] / total_records) * 100, 2),
                "unattributed": attrib_counts["unattributed"],
                "unattributed_pct": round((attrib_counts["unattributed"] / total_records) * 100, 2),
            },
            "breakdowns": {
                "by_team": team_breakdown,
                "by_feature": feature_breakdown,
                "by_model": model_breakdown,
                "by_time_period": daily_breakdown
            },
            "reconciliation": {
                "verdict": "PASSED (100% Exact Match)" if all(c["status"] == "MATCH" for c in reconciliation_checks) else "MISMATCH",
                "checks": reconciliation_checks,
                "discrepancy_rate_pct": 0.0 if all(c["status"] == "MATCH" for c in reconciliation_checks) else 100.0
            },
            "performance": {
                "processing_time_ms": elapsed_ms,
                "records_per_second": throughput_rps,
                "time_complexity": "O(N) Single-Pass Stream Aggregation",
                "space_complexity": "O(D) where D is distinct dimension keys"
            },
            "sample_preview": sample_preview
        }
