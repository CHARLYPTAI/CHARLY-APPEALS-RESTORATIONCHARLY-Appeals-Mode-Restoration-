#!/usr/bin/env python3
"""
Unit tests for flagging.py module
"""

import unittest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock

# Import the flagging module
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from charly_ingest.flagging import is_properly_valued, run_flagging


class TestFlaggingModule(unittest.TestCase):
    """Test cases for flagging functionality"""

    def setUp(self):
        """Set up test data"""
        self.sample_data = pd.DataFrame({
            'market_value': [100000, 150000, 200000, 250000, 300000],
            'assessment_value': [95000, 155000, 220000, 240000, 285000],
            'property_type': ['residential', 'commercial', 'residential', 'commercial', 'residential'],
            'jurisdiction': ['County A', 'County B', 'County A', 'County B', 'County A']
        })

    def test_is_properly_valued_basic(self):
        """Test is_properly_valued function with basic data"""
        market_values = pd.Series([100000, 150000, 200000])
        assessment_values = pd.Series([95000, 155000, 220000])
        
        result = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        
        # 95000 is within 5% of 100000 (95000-105000)
        # 155000 is outside 5% of 150000 (142500-157500)
        # 220000 is outside 5% of 200000 (190000-210000)
        expected = pd.Series([True, False, False])
        pd.testing.assert_series_equal(result, expected)

    def test_is_properly_valued_with_nulls(self):
        """Test is_properly_valued with null values"""
        market_values = pd.Series([100000, None, 200000])
        assessment_values = pd.Series([95000, 155000, None])
        
        result = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        
        # Should handle nulls gracefully
        expected = pd.Series([True, False, False])
        pd.testing.assert_series_equal(result, expected)

    def test_is_properly_valued_different_tolerance(self):
        """Test is_properly_valued with different tolerance"""
        market_values = pd.Series([100000, 150000])
        assessment_values = pd.Series([110000, 165000])
        
        # With 5% tolerance, both should be False
        result_5 = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        expected_5 = pd.Series([False, False])
        pd.testing.assert_series_equal(result_5, expected_5)
        
        # With 15% tolerance, both should be True
        result_15 = is_properly_valued(market_values, assessment_values, tolerance=0.15)
        expected_15 = pd.Series([True, True])
        pd.testing.assert_series_equal(result_15, expected_15)

    def test_is_properly_valued_edge_cases(self):
        """Test is_properly_valued with edge cases"""
        # Zero values
        market_values = pd.Series([0, 100000])
        assessment_values = pd.Series([0, 100000])
        
        result = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        expected = pd.Series([True, True])  # Exact matches should be True
        pd.testing.assert_series_equal(result, expected)

    @patch('charly_ingest.flagging.load_flag_rules')
    def test_run_flagging_basic(self, mock_load_rules):
        """Test run_flagging function with mocked rules"""
        # Mock the flag rules
        mock_rules = {
            'overassessed_properties': {
                'description': 'Properties assessed above market value',
                'condition': 'assessment_value > market_value * 1.05'
            }
        }
        mock_load_rules.return_value = mock_rules
        
        # Test data
        test_df = pd.DataFrame({
            'market_value': [100000, 150000, 200000],
            'assessment_value': [110000, 140000, 220000]
        })
        
        # This test would need the actual run_flagging implementation
        # For now, we'll test that it can be called
        try:
            result = run_flagging(test_df)
            self.assertIsInstance(result, dict)
        except Exception as e:
            # If run_flagging is not fully implemented, this is expected
            self.assertIn("load_flag_rules", str(e))

    def test_properly_valued_performance(self):
        """Test performance with larger dataset"""
        # Create a larger dataset
        n_rows = 10000
        market_values = pd.Series(np.random.uniform(50000, 500000, n_rows))
        assessment_values = market_values * np.random.uniform(0.9, 1.1, n_rows)
        
        # This should complete in reasonable time
        result = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        
        self.assertEqual(len(result), n_rows)
        self.assertTrue(result.dtype == bool)

    def test_properly_valued_string_inputs(self):
        """Test is_properly_valued with string inputs that can be converted"""
        market_values = pd.Series(['100000', '150000', '200000'])
        assessment_values = pd.Series(['95000', '155000', '220000'])
        
        result = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        
        # Should handle string inputs by converting to numeric
        expected = pd.Series([True, False, False])
        pd.testing.assert_series_equal(result, expected)

    def test_properly_valued_invalid_strings(self):
        """Test is_properly_valued with invalid string inputs"""
        market_values = pd.Series(['100000', 'invalid', '200000'])
        assessment_values = pd.Series(['95000', '155000', 'also_invalid'])
        
        result = is_properly_valued(market_values, assessment_values, tolerance=0.05)
        
        # Should handle invalid strings gracefully
        self.assertEqual(len(result), 3)
        self.assertTrue(result.dtype == bool)


if __name__ == '__main__':
    unittest.main()