"""
financials.py

Purpose:
    - Load financial calculation rules from JSON configuration.
    - Compute Net Operating Income (NOI), Expense Ratio, Cap Rate, and Vacancy Adjustment.
    - Return a DataFrame with new columns for these metrics.

Usage:
    from charly_ingest.financials import compute_financials
    df_with_metrics = compute_financials(df)
"""

import os
import json
import logging
from typing import Dict

import pandas as pd

# ----------------------------
# Configure Logging
# ----------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
logger.addHandler(handler)


def _load_financial_rules() -> Dict:
    """
    Load financial calculation rules from JSON (config/financial_rules.json).
    Expects the environment variable FINANCIAL_RULES_PATH or defaults to config/financial_rules.json.
    """
    rules_path = os.getenv(
        "FINANCIAL_RULES_PATH",
        os.path.join(os.path.dirname(__file__), "..", "config", "financial_rules.json"),
    )
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            rules = json.load(f)
            logger.info(f"Loaded financial rules from {rules_path}")
            return rules
    except FileNotFoundError:
        msg = f"Financial rules file not found at: {rules_path}"
        logger.error(msg)
        raise
    except json.JSONDecodeError as e:
        msg = f"Error decoding financial rules JSON: {e}"
        logger.error(msg)
        raise


def compute_financials(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute financial metrics (NOI, Expense Ratio, Cap Rate, Vacancy Adjustment) on the input DataFrame.

    Parameters:
        df (pd.DataFrame): Must contain at least these columns (per financial_rules.json fields mapping):
            - total_income
            - total_expenses
            - market_value
            - vacancy_rate

    Returns:
        pd.DataFrame: Copy of the input DataFrame with new columns:
            - noi
            - expense_ratio
            - cap_rate
            - vacancy_adjustment
    """
    df_out = df.copy()

    # 1. Load rules
    rules = _load_financial_rules()

    # 2. Map field names
    fields_map = rules.get("fields", {})
    income_col = fields_map.get("income")
    expenses_col = fields_map.get("expenses")
    market_value_col = fields_map.get("market_value")
    vacancy_rate_col = fields_map.get("vacancy_rate")

    # 3. Verify required columns
    missing = [
        col
        for col in [income_col, expenses_col, market_value_col, vacancy_rate_col]
        if col not in df_out.columns
    ]
    if missing:
        msg = f"Missing required columns for financials: {missing}"
        logger.error(msg)
        raise KeyError(msg)

    # 4. Coerce numeric
    income = pd.to_numeric(df_out[income_col], errors="coerce")
    expenses = pd.to_numeric(df_out[expenses_col], errors="coerce")
    market_val = pd.to_numeric(df_out[market_value_col], errors="coerce")
    vacancy_rate = pd.to_numeric(df_out[vacancy_rate_col], errors="coerce")

    # 5. Compute NOI = income - expenses
    df_out["noi"] = income.subtract(expenses, fill_value=0)

    # 6. Compute Expense Ratio = expenses / income (avoid div by zero)
    safe_income = income.replace({0: pd.NA})
    df_out["expense_ratio"] = expenses.divide(safe_income)

    # 7. Compute Cap Rate = NOI / market_value (avoid div by zero)
    safe_market = market_val.replace({0: pd.NA})
    df_out["cap_rate"] = df_out["noi"].divide(safe_market)

    # 8. Compute Vacancy Adjustment = income * (1 - vacancy_rate)
    clipped_vacancy = vacancy_rate.clip(lower=0.0, upper=1.0)
    df_out["vacancy_adjustment"] = income.multiply(1.0 - clipped_vacancy)

    logger.info(
        "Computed financial metrics: NOI, expense_ratio, cap_rate, vacancy_adjustment"
    )
    return df_out
