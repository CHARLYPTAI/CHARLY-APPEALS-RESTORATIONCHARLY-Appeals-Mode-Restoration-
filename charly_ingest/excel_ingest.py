# excel_ingest.py

import pandas as pd
from alias_mapper import map_fields
from utils import log_info, log_error
from datetime import datetime


def parse_date(date_str):
    if pd.isna(date_str):
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(str(date_str), fmt).date()
        except ValueError:
            continue
    log_error(f"Failed to parse date: {date_str}")
    return None


def ingest_excel(file_path):
    try:
        log_info(f"Loading Excel file: {file_path}")
        df = pd.read_excel(file_path, engine="openpyxl")
        log_info(f"Original columns: {list(df.columns)}")
        col_map = map_fields(df.columns)
        df = df.rename(columns=col_map)
        log_info(f"Mapped columns: {list(df.columns)}")

        # Convert types for new fields
        if "property_id" in df.columns:
            df["property_id"] = df["property_id"].astype(str)
        if "assessment_value" in df.columns:
            df["assessment_value"] = pd.to_numeric(
                df["assessment_value"], errors="coerce"
            )
        if "market_value" in df.columns:
            df["market_value"] = pd.to_numeric(df["market_value"], errors="coerce")
        if "last_sale_price" in df.columns:
            df["last_sale_price"] = pd.to_numeric(
                df["last_sale_price"], errors="coerce"
            )
        if "age" in df.columns:
            df["age"] = pd.to_numeric(df["age"], errors="coerce").astype("Int64")
        if "vacancy_rate" in df.columns:
            df["vacancy_rate"] = pd.to_numeric(df["vacancy_rate"], errors="coerce")
        if "expense_ratio" in df.columns:
            df["expense_ratio"] = pd.to_numeric(df["expense_ratio"], errors="coerce")
        if "last_sale_date" in df.columns:
            df["last_sale_date"] = df["last_sale_date"].apply(parse_date)
        if "assessment_date" in df.columns:
            df["assessment_date"] = df["assessment_date"].apply(parse_date)
        if "last_renovation_date" in df.columns:
            df["last_renovation_date"] = df["last_renovation_date"].apply(parse_date)

        log_info(f"Loaded {len(df)} rows")
        return df

    except Exception as e:
        log_error(f"Failed to load Excel file: {e}")
        raise
