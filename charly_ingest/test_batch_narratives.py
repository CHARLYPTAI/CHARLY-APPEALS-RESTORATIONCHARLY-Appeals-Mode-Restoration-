"""
test_batch_narratives.py

Purpose:
    - Unit test for generate_batch_narratives.py
    - Verifies that given a small input CSV, and with NarrativeClient.generate mocked,
      the script writes out a new CSV containing the "narrative" column.
"""

import os
import tempfile
import unittest
from unittest import mock
import pandas as pd

# Import the batch script’s main function
from charly_ingest.generate_batch_narratives import main as batch_main


class TestBatchNarratives(unittest.TestCase):
    def setUp(self):
        # Create a temporary directory to hold input and output CSVs
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.input_csv = os.path.join(self.tmp_dir.name, "input.csv")
        self.output_csv = os.path.join(self.tmp_dir.name, "output.csv")

        # Create a small DataFrame with two rows of fake data
        df = pd.DataFrame(
            [
                {
                    "property_id": "A1",
                    "address": "123 Fake St",
                    "noi": 1000,
                    "total_income": 5000,
                    "total_expenses": 4000,
                },
                {
                    "property_id": "B2",
                    "address": "456 Phantom Rd",
                    "noi": 2000,
                    "total_income": 8000,
                    "total_expenses": 6000,
                },
            ]
        )
        df.to_csv(self.input_csv, index=False)

    def tearDown(self):
        # Clean up temporary directory
        self.tmp_dir.cleanup()

    @mock.patch(
        "charly_ingest.generate_batch_narratives.NarrativeClient.generate",
        return_value="FAKE_NARRATIVE",
    )
    @mock.patch("sys.argv", new=["", "--input", "<input>", "--output", "<output>"])
    def test_batch_creates_narratives(self, mock_generate, mock_argv):
        """
        Simulate:
          python -m charly_ingest.generate_batch_narratives --input input.csv --output output.csv
        with NarrativeClient.generate returning "FAKE_NARRATIVE".
        """
        # Patch sys.argv to use our temp file paths
        mock_argv[:] = [
            "",  # program name placeholder
            "--input",
            self.input_csv,
            "--output",
            self.output_csv,
            "--prompt-version",
            "v1",
            "--workers",
            "2",
        ]

        # Run the batch script’s main()
        batch_main()

        # After running, output CSV should exist
        self.assertTrue(os.path.isfile(self.output_csv))

        # Read it and confirm "narrative" column exists and values match
        out_df = pd.read_csv(self.output_csv)
        self.assertIn("narrative", out_df.columns)
        self.assertEqual(len(out_df), 2)
        self.assertTrue((out_df["narrative"] == "FAKE_NARRATIVE").all())


if __name__ == "__main__":
    unittest.main()
