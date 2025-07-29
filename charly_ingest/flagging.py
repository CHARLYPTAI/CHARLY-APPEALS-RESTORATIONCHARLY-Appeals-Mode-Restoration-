"""
flagging.py

Purpose:
    - Apply user-defined flagging rules to a DataFrame of property records.
    - Returns a dict mapping each rule name (str) to a Pandas Series[bool].

Usage:
    from charly_ingest.flagging import run_flagging
    flags_dict = run_flagging(df)   # df is a Pandas DataFrame
"""

import logging
from typing import Dict
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
logger.addHandler(handler)


def is_properly_valued(
    market_value: pd.Series, assessment_value: pd.Series, tolerance: float = 0.05
) -> pd.Series:
    """
    Determine if properties are properly valued based on assessment vs market value.

    A property is considered properly valued if its assessment value is within ±5% (default)
    of its market value.

    Args:
        market_value: Series of market values
        assessment_value: Series of assessment values
        tolerance: Acceptable variance as decimal (0.05 = 5%)

    Returns:
        Boolean Series where True indicates properly valued property
    """
    # Handle missing or invalid values
    valid_market = pd.to_numeric(market_value, errors="coerce")
    valid_assessment = pd.to_numeric(assessment_value, errors="coerce")

    # Calculate bounds
    lower_bound = valid_market * (1 - tolerance)
    upper_bound = valid_market * (1 + tolerance)

    # Property is properly valued if assessment is within bounds
    # Returns False for any missing/invalid values
    properly_valued = (
        valid_market.notna()
        & valid_assessment.notna()
        & (valid_market > 0)  # Avoid division by zero
        & (valid_assessment >= lower_bound)
        & (valid_assessment <= upper_bound)
    )

    return properly_valued


def run_flagging(df: pd.DataFrame) -> Dict[str, pd.Series]:
    """
    Apply all flagging rules to the input DataFrame and return a dict of boolean Series.

    Current flags:
    - overassessment: Placeholder (always False)
    - vacancy_anomaly: Placeholder (always False)
    - flag_properly_valued: True when assessment is within ±5% of market value

    Args:
        df: DataFrame containing property data with market_value and assessment_value columns

    Returns:
        Dict mapping flag names to boolean Series
    """
    logger.info("Running flagging rules with properly valued logic.")

    flags: Dict[str, pd.Series] = {
        "overassessment": pd.Series([False] * len(df), index=df.index),
        "vacancy_anomaly": pd.Series([False] * len(df), index=df.index),
    }

    # Add properly valued flag
    try:
        # Try common column name variations
        market_col = None
        assessment_col = None

        # Check for market value column
        for col in df.columns:
            col_lower = col.lower().replace("_", "").replace(" ", "")
            if "marketvalue" in col_lower or "market_value" in col_lower:
                market_col = col
                break

        # Check for assessment value column
        for col in df.columns:
            col_lower = col.lower().replace("_", "").replace(" ", "")
            if "assessmentvalue" in col_lower or "assessment_value" in col_lower:
                assessment_col = col
                break

        if market_col and assessment_col:
            flags["flag_properly_valued"] = is_properly_valued(
                df[market_col], df[assessment_col]
            )
            logger.info(
                f"Computed properly valued flag using {market_col} and {assessment_col}"
            )
        else:
            # Fallback: set all to False if columns not found
            flags["flag_properly_valued"] = pd.Series([False] * len(df), index=df.index)
            missing_cols = []
            if not market_col:
                missing_cols.append("market_value")
            if not assessment_col:
                missing_cols.append("assessment_value")
            logger.warning(
                f"Could not compute properly valued flag - missing columns: {missing_cols}"
            )

    except Exception as e:
        logger.error(f"Error computing properly valued flag: {e}")
        flags["flag_properly_valued"] = pd.Series([False] * len(df), index=df.index)

    return flags
