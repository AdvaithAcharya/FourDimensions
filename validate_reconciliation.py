"""
Commvault Challenge PS-404: LLM FinOps Accuracy & Reconciliation Verification Script

This script deterministically validates the FinOps accounting engine against
known expected theoretical values, verifying zero floating-point discrepancy (Delta = 0.00000000).
"""

import asyncio
import json
import time
from backend.validator import FinOpsValidator

async def main():
    print("=" * 78)
    print("  COMMVAULT PS-404: LLM FINOPS RECONCILIATION & ACCURACY AUDIT")
    print("=" * 78)
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("Auditing Decimal Accounting Engine against Known Expected Values...\n")

    report = await FinOpsValidator.run_audit_suite()

    print(f"{'METRIC':<28} | {'EXPECTED':<15} | {'ACTUAL':<15} | {'DIFF':<10} | {'STATUS'}")
    print("-" * 78)

    for item in report["comparisons"]:
        metric = item["metric"]
        exp = item["expected"]
        act = item["actual"]
        diff = item["discrepancy"]
        status = item["status"]
        print(f"{metric:<28} | {exp:<15} | {act:<15} | {diff:<10} | [{status}]")

    print("-" * 78)
    print(f"\nAUDIT VERDICT: {report['reconciliation_verdict']}")
    print(f"ERROR RATE:    {report['error_rate_pct']:.6f}%")
    print(f"AUDIT LATENCY: {report['verification_latency_ms']} ms")
    
    print("\n" + "=" * 78)
    print("  PERFORMANCE & COMPLEXITY BENCHMARKS")
    print("=" * 78)
    bench = report["benchmarks"]
    print(f"• Pricing Lookup Complexity:     {bench['pricing_lookup_time_complexity']}")
    print(f"• Cost Calculation Complexity:   {bench['calculation_time_complexity']}")
    print(f"• Arithmetic Precision:          {bench['arithmetic_precision']}")
    print(f"• Space Complexity Overhead:     {bench['space_complexity']}")
    print(f"• 1,000 Evaluations Elapsed:     {bench['throughput_1000_evals_ms']} ms")
    print(f"• Throughput Rate:               ~{bench['evaluations_per_second']:,} evals/sec")
    print("=" * 78)

    # Save artifact report
    with open("validation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    print("\nSaved detailed report artifact to 'validation_report.json'.")

if __name__ == "__main__":
    asyncio.run(main())
