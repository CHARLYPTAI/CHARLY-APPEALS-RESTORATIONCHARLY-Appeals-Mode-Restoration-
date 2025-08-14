# charly_ingest/test_main.py

"""
test_main.py

Purpose:
    - End-to-end unit test for main.py in the charly_ingest package.
    - Verifies that, given a minimal sample CSV, the pipeline:
      1. Ingests the CSV
      2. Applies placeholder flagging rules
      3. Computes financial metrics
      4. Writes a final output CSV with the expected columns and values

Usage:
    From the project root (`CHARLY_TEST`), run:
        python -m unittest charly_ingest.test_main

    This creates a temporary CSV file, invokes `main.py` via `main()`, and checks the resulting CSV.
"""

import os
import sys
import unittest
import tempfile
import pandas as pd

from charly_ingest import (
    main as main_module,
)  # imports main() from charly_ingest/main.py


class TestMainPipeline(unittest.TestCase):
    def setUp(self):
        """
        Create a temporary directory and write a minimal sample CSV
        with the required columns: total_income, total_expenses, market_value, vacancy_rate.
        """
        # Create a temporary directory that will be cleaned up in tearDown()
        self.temp_dir = tempfile.TemporaryDirectory()
        # Paths for input and output CSVs inside the temp directory
        self.input_csv = os.path.join(self.temp_dir.name, "sample_financials.csv")
        self.output_csv = os.path.join(self.temp_dir.name, "test_output.csv")

        # Write two rows of sample data
        sample_content = (
            "total_income,total_expenses,market_value,vacancy_rate\n"
            "100000,60000,500000,0.10\n"
            "0,0,250000,0.20\n"
        )
        with open(self.input_csv, "w", encoding="utf-8") as f:
            f.write(sample_content)

    def tearDown(self):
        """Clean up the temporary directory and its contents."""
        self.temp_dir.cleanup()

    def test_end_to_end_pipeline(self):
        """
        1. Set sys.argv so that main_module.main() behaves as if called from command line.
        2. Invoke main_module.main() to process the sample CSV.
        3. Read the output CSV and verify:
           - All expected columns exist (original + flags + metrics).
           - Computed values for row 0 match expected financial calculations.
           - Placeholder flags default to False.
        """
        # Backup original sys.argv
        original_argv = sys.argv.copy()
        try:
            # Simulate: python main.py --input <self.input_csv> --output <self.output_csv>
            sys.argv = [
                "main.py",
                "--input",
                self.input_csv,
                "--output",
                self.output_csv,
            ]
            # Run the main() function, which will read input, apply flags, compute metrics, and write output
            main_module.main()
        finally:
            # Restore original sys.argv
            sys.argv = original_argv

        # Confirm that the output CSV was created
        self.assertTrue(os.path.isfile(self.output_csv), "Output CSV was not created.")

        # Read the output CSV into a DataFrame
        df = pd.read_csv(self.output_csv)

        # Define the expected column order:
        # 1. Original columns from sample CSV
        # 2. Placeholder flags from flagging.py (overassessment, vacancy_anomaly)
        # 3. Four financial metrics: noi, expense_ratio, cap_rate, vacancy_adjustment
        expected_columns = [
            "total_income",
            "total_expenses",
            "market_value",
            "vacancy_rate",
            "overassessment",
            "vacancy_anomaly",
            "noi",
            "expense_ratio",
            "cap_rate",
            "vacancy_adjustment",
        ]
        self.assertListEqual(
            list(df.columns),
            expected_columns,
            f"Output columns mismatch. Expected {expected_columns}, got {list(df.columns)}",
        )

        # Verify the first row's computed values:
        # Row 0 (100000, 60000, 500000, 0.10):
        #   - NOI = 100000 - 60000 = 40000
        #   - Expense Ratio = 60000 / 100000 = 0.60
        #   - Cap Rate = 40000 / 500000 = 0.08
        #   - Vacancy Adjustment = 100000 * (1 - 0.10) = 90000
        self.assertAlmostEqual(df.at[0, "noi"], 40000.0, places=7)
        self.assertAlmostEqual(df.at[0, "expense_ratio"], 0.60, places=7)
        self.assertAlmostEqual(df.at[0, "cap_rate"], 0.08, places=7)
        self.assertAlmostEqual(df.at[0, "vacancy_adjustment"], 90000.0, places=7)

        # Verify that placeholder flags are present and default to False for both rows
        self.assertIn("overassessment", df.columns, "Flag 'overassessment' is missing.")
        self.assertIn(
            "vacancy_anomaly", df.columns, "Flag 'vacancy_anomaly' is missing."
        )
        self.assertFalse(
            df.at[0, "overassessment"], "Expected overassessment=False for row 0."
        )
        self.assertFalse(
            df.at[1, "vacancy_anomaly"], "Expected vacancy_anomaly=False for row 1."
        )

        # Verify second row's metrics:
        # Row 1 (0, 0, 250000, 0.20):
        #   - NOI = 0 - 0 = 0
        #   - Expense Ratio = 0 / 0 => NaN
        #   - Cap Rate = 0 / 250000 = 0.0
        #   - Vacancy Adjustment = 0 * (1 - 0.20) = 0.0
        self.assertAlmostEqual(df.at[1, "noi"], 0.0, places=7)
        self.assertTrue(
            pd.isna(df.at[1, "expense_ratio"]),
            "Expected NaN for expense_ratio when income=0.",
        )
        self.assertAlmostEqual(df.at[1, "cap_rate"], 0.0, places=7)
        self.assertAlmostEqual(df.at[1, "vacancy_adjustment"], 0.0, places=7)


if __name__ == "__main__":
    unittest.main()
