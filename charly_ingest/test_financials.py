"""
test_financials.py

Purpose:
    - Unit tests for the `compute_financials` function in financials.py.
    - Verifies correct calculation of:
        • Net Operating Income (NOI)
        • Expense Ratio
        • Cap Rate
        • Vacancy Adjustment

Usage:
    1. Ensure `financials.py` is in the same directory as this test file.
    2. From your terminal, run:
           python -m unittest test_financials.py
       or simply:
           python test_financials.py
    3. All tests should pass without errors if calculations are correct.
"""

import unittest
import pandas as pd
import math

from .financials import compute_financials


class TestFinancials(unittest.TestCase):
    def setUp(self):
        """
        Prepare a sample DataFrame with two rows:
        - Row 0: Nonzero values for income, expenses, market_value, and vacancy_rate.
        - Row 1: Zero income to verify divide-by-zero handling.
        """
        data = {
            "total_income": [100000.0, 0.0],
            "total_expenses": [60000.0, 0.0],
            "market_value": [500000.0, 250000.0],
            "vacancy_rate": [0.10, 0.20],
        }
        self.df = pd.DataFrame(data)

    def test_basic_calculations(self):
        """
        Row 0 expected:
          - NOI = 100000.0 − 60000.0 = 40000.0
          - Expense Ratio = 60000.0 ÷ 100000.0 = 0.60
          - Cap Rate = 40000.0 ÷ 500000.0 = 0.08
          - Vacancy Adjustment = 100000.0 × (1 − 0.10) = 90000.0

        Row 1 expected:
          - NOI = 0.0 − 0.0 = 0.0
          - Expense Ratio = NaN (divide by zero)
          - Cap Rate = 0.0 ÷ 250000.0 = 0.0
          - Vacancy Adjustment = 0.0 × (1 − 0.20) = 0.0
        """
        result_df = compute_financials(self.df)

        # Row 0 checks
        self.assertAlmostEqual(result_df.at[0, "noi"], 40000.0, places=7)
        self.assertAlmostEqual(result_df.at[0, "expense_ratio"], 0.60, places=7)
        self.assertAlmostEqual(result_df.at[0, "cap_rate"], 0.08, places=7)
        self.assertAlmostEqual(result_df.at[0, "vacancy_adjustment"], 90000.0, places=7)

        # Row 1 checks
        self.assertAlmostEqual(result_df.at[1, "noi"], 0.0, places=7)
        # Expense ratio should be NaN because income was zero
        self.assertTrue(math.isnan(result_df.at[1, "expense_ratio"]))
        self.assertAlmostEqual(result_df.at[1, "cap_rate"], 0.0, places=7)
        self.assertAlmostEqual(result_df.at[1, "vacancy_adjustment"], 0.0, places=7)

    def test_negative_and_invalid_values(self):
        """
        Verify behavior when dataframe contains negative or invalid (non-numeric) entries.
        - Negative income/expenses should compute correctly (subtraction/division).
        - Non-numeric strings should coerce to NaN and propagate to results.
        """
        data = {
            "total_income": ["abc", -50000.0],
            "total_expenses": [20000.0, "xyz"],
            "market_value": [0.0, 100000.0],
            "vacancy_rate": [1.50, -0.10],
        }
        df2 = pd.DataFrame(data)
        result_df2 = compute_financials(df2)

        # Row 0: income = "abc" → NaN; expenses = 20000.0
        #   - NOI = NaN − 20000.0 = NaN
        #   - Expense Ratio = 20000.0 ÷ NaN = NaN
        #   - Cap Rate = NaN ÷ 0.0 = NaN
        #   - Vacancy Adjustment = NaN × (1 − clipped(1.50 to 1.0)) = NaN × 0.0 = NaN
        self.assertTrue(math.isnan(result_df2.at[0, "noi"]))
        self.assertTrue(math.isnan(result_df2.at[0, "expense_ratio"]))
        self.assertTrue(math.isnan(result_df2.at[0, "cap_rate"]))
        self.assertTrue(math.isnan(result_df2.at[0, "vacancy_adjustment"]))

        # Row 1: income = -50000.0; expenses = "xyz" → NaN; market_value = 100000.0; vacancy_rate = -0.10 → clipped to 0.0
        #   - NOI = -50000.0 − NaN = NaN
        #   - Expense Ratio = NaN ÷ -50000.0 = NaN
        #   - Cap Rate = NaN ÷ 100000.0 = NaN
        #   - Vacancy Adjustment = -50000.0 × (1 − 0.0) = -50000.0
        self.assertTrue(math.isnan(result_df2.at[1, "noi"]))
        self.assertTrue(math.isnan(result_df2.at[1, "expense_ratio"]))
        self.assertTrue(math.isnan(result_df2.at[1, "cap_rate"]))
        self.assertAlmostEqual(
            result_df2.at[1, "vacancy_adjustment"], -50000.0, places=7
        )


if __name__ == "__main__":
    unittest.main()
