# charly_ingest/generate_batch_narratives.py

"""
generate_batch_narratives.py

Purpose:
    - Read a CSV of property records (with all raw fields, flags, and computed financial metrics).
    - For each row, call NarrativeClient.generate(...) to produce a narrative.
    - Append the narrative as a new column "narrative" in the DataFrame.
    - Write the updated DataFrame to a new CSV.

Usage (from project root):
    python -m charly_ingest.generate_batch_narratives \
        --input final_results.csv \
        --output results_with_narratives.csv \
        --prompt-version v1 \
        --workers 5

Arguments:
    --input        Path to the input CSV file (must include columns used by NarrativeClient).
    --output       Path to the output CSV file.
    --prompt-version (optional) Which prompt version to use (default "v1").
    --workers      (optional) Number of threads to use (default 4).

Requirements:
    - Python 3.8+
    - pandas
    - concurrent.futures
    - NarrativeClient from charly_gpt_narrative_generator.py
"""

import argparse
import os
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict

from charly_narrative.charly_gpt_narrative_generator import NarrativeClient  # type: ignore


def _process_row(
    index: Any, row: pd.Series, prompt_version: str, client: NarrativeClient
) -> Dict[str, Any]:
    """
    Given a DataFrame row, generate its narrative.
    Returns a dict with {"index": index, "narrative": str or None}.
    """
    record = row.to_dict()
    # Ensure property_id is present for caching/logging. If missing, use index as string.
    record.setdefault("property_id", str(index))
    narrative = client.generate(record, prompt_version=prompt_version)
    return {"index": index, "narrative": narrative}


def main():
    parser = argparse.ArgumentParser(
        description="Batch-generate narratives for a CSV of property records."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input CSV containing property records plus flags/metrics.",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Path to output CSV that will include a new 'narrative' column.",
    )
    parser.add_argument(
        "--prompt-version",
        default="v1",
        help="Which prompt version to use (default: v1).",
    )
    parser.add_argument(
        "--workers", type=int, default=4, help="Number of threads to use (default: 4)."
    )
    args = parser.parse_args()

    input_path = args.input
    output_path = args.output
    prompt_version = args.prompt_version
    max_workers = args.workers

    if not os.path.isfile(input_path):
        print(f"ERROR: Input file not found: {input_path}")
        return

    # 1) Read the input CSV into a DataFrame
    df = pd.read_csv(input_path)

    # 2) Prepare an empty "narrative" column
    df["narrative"] = None

    # 3) Instantiate a single NarrativeClient (it has its own cache internally)
    client = NarrativeClient()

    # 4) Use ThreadPoolExecutor to parallelize generation
    futures = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for idx, row in df.iterrows():
            futures.append(
                executor.submit(_process_row, idx, row, prompt_version, client)
            )

        # As each future completes, write its narrative back into df
        for future in as_completed(futures):
            result = future.result()
            i = result["index"]
            df.at[i, "narrative"] = result["narrative"]

    # 5) Write the updated DataFrame to output CSV
    df.to_csv(output_path, index=False)
    print(f"Batch narrative generation complete. Output: {output_path}")


if __name__ == "__main__":
    main()
