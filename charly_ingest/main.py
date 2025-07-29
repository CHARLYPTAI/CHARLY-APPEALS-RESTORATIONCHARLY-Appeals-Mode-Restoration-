"""
main.py

Purpose:
    - CHARLY’s end-to-end ingestion → flagging → financial-metrics pipeline.
    - Detects file type, ingests raw data, applies flags, then computes financial metrics.
    - Writes a final CSV containing original fields, flags, and metrics.

Usage:
    From the project root (CHARLY_TEST), run:
       python -m charly_ingest.main --input <raw_file> --output <output_csv>

    Or set PYTHONPATH="." and run directly:
       python charly_ingest/main.py --input <raw_file> --output <output_csv>
"""

import os
import sys
import logging
import argparse

import pandas as pd

# ──────────────────────────────────────────────────────────────────────────────
# Package-relative imports (main.py lives under charly_ingest/)
# ──────────────────────────────────────────────────────────────────────────────
from .file_detector import detect_file_type_and_ingest
from .flagging import run_flagging
from .financials import compute_financials

# ──────────────────────────────────────────────────────────────────────────────
# Configure Logging
# ──────────────────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
logger.addHandler(handler)


def main():
    """
    1. Parse arguments for input file and output CSV.
    2. Ingest raw file into a DataFrame.
    3. Run flagging rules → dict of boolean Series.
    4. Merge raw DataFrame + flags DataFrame.
    5. Compute financial metrics on merged DataFrame.
    6. Write final DataFrame (original + flags + metrics) to CSV.
    """
    parser = argparse.ArgumentParser(
        description="CHARLY end-to-end ingestion → flagging → financials pipeline"
    )
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        help="Path to raw input file (CSV, Excel, JSON, TXT, XML).",
    )
    parser.add_argument(
        "--output",
        "-o",
        required=True,
        help="Path for output CSV with flags and financial metrics.",
    )
    args = parser.parse_args()

    input_path = args.input
    output_path = args.output

    # ──────────────────────────────────────────────────────────────────────────────
    # Step 1: Ingest the raw file into a DataFrame
    # ──────────────────────────────────────────────────────────────────────────────
    try:
        logger.info(f"Ingesting file: {input_path}")
        df_raw = detect_file_type_and_ingest(input_path)
        logger.info(f"Ingestion complete: {len(df_raw)} rows loaded.")
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        sys.exit(1)

    # ──────────────────────────────────────────────────────────────────────────────
    # Step 2: Run the flagging rules
    # ──────────────────────────────────────────────────────────────────────────────
    try:
        logger.info("Running flagging rules...")
        flags_dict = run_flagging(df_raw)  # Must accept exactly one DataFrame argument
        df_flags = pd.DataFrame(flags_dict)
        logger.info("Flagging complete.")
    except TypeError as e:
        logger.error(
            "run_flagging signature mismatch.\n"
            "Expected: def run_flagging(df: pd.DataFrame) -> Dict[str, pd.Series].\n"
            f"Error: {e}"
        )
        sys.exit(1)
    except Exception as e:
        logger.error(f"Flagging failed: {e}")
        sys.exit(1)

    # ──────────────────────────────────────────────────────────────────────────────
    # Step 3: Merge raw DataFrame + flag columns
    # ──────────────────────────────────────────────────────────────────────────────
    try:
        df_with_flags = pd.concat(
            [df_raw.reset_index(drop=True), df_flags.reset_index(drop=True)], axis=1
        )
        logger.info("Merged raw data with flags.")
    except Exception as e:
        logger.error(f"Failed to merge flags: {e}")
        sys.exit(1)

    # ──────────────────────────────────────────────────────────────────────────────
    # Step 4: Compute financial metrics
    # ──────────────────────────────────────────────────────────────────────────────
    try:
        logger.info(
            "Computing financial metrics (NOI, Expense Ratio, Cap Rate, Vacancy Adjustment)..."
        )
        df_final = compute_financials(
            df_with_flags
        )  # Must accept exactly one DataFrame argument
        logger.info("Financial metrics appended.")
    except TypeError as e:
        logger.error(
            "compute_financials signature mismatch.\n"
            "Expected: def compute_financials(df: pd.DataFrame) -> pd.DataFrame.\n"
            f"Error: {e}"
        )
        sys.exit(1)
    except Exception as e:
        logger.error(f"Financial calculation failed: {e}")
        sys.exit(1)

    # ──────────────────────────────────────────────────────────────────────────────
    # Step 5: Write the final DataFrame to CSV
    # ──────────────────────────────────────────────────────────────────────────────
    try:
        df_final.to_csv(output_path, index=False)
        logger.info(f"Wrote final results to: {output_path}")
    except Exception as e:
        logger.error(f"Failed to write output CSV: {e}")
        sys.exit(1)

    print("Pipeline complete. Output written to:", output_path)


if __name__ == "__main__":
    main()
