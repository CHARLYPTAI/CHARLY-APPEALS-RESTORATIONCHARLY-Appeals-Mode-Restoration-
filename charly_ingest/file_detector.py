"""
file_detector.py

Purpose:
    - Detects the file extension of the input file.
    - Dispatches to the appropriate specialized ingest module with alias mapping.
    - Returns a validated Pandas DataFrame with normalized column names.

Usage:
    from charly_ingest.file_detector import detect_file_type_and_ingest
    df = detect_file_type_and_ingest("path/to/my_data.csv")
"""

import os
import logging
import pandas as pd
from typing import Dict, Any
import json

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Load alias mapping configuration
def load_alias_map() -> Dict[str, list]:
    """Load the alias mapping configuration"""
    try:
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "alias_map.json")
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load alias map: {e}")
        return {}

def normalize_column_name(col_name: str) -> str:
    """Normalize column name for mapping"""
    import re
    # Convert to lowercase and remove spaces, underscores, dashes, and special chars
    normalized = re.sub(r'[\s_\-\.]', '', col_name.lower())
    return normalized

def apply_alias_mapping(df: pd.DataFrame) -> pd.DataFrame:
    """Apply alias mapping to DataFrame columns"""
    alias_map = load_alias_map()
    if not alias_map:
        logger.warning("No alias mapping available, returning original DataFrame")
        return df
    
    column_mapping = {}
    
    # Check each column in the DataFrame
    for col in df.columns:
        normalized_col = normalize_column_name(col)
        
        # Check against all canonical fields and their aliases
        for canonical_field, aliases in alias_map.items():
            if col in column_mapping:
                break  # Already mapped this column
                
            for alias in aliases:
                normalized_alias = normalize_column_name(alias)
                if normalized_col == normalized_alias:
                    column_mapping[col] = canonical_field
                    logger.debug(f"Mapped '{col}' -> '{canonical_field}' via alias '{alias}'")
                    break
    
    if column_mapping:
        logger.info(f"Applying column mapping: {column_mapping}")
        df = df.rename(columns=column_mapping)
    else:
        logger.warning("No column mappings found")
        logger.debug(f"Available columns: {list(df.columns)}")
        logger.debug(f"Normalized columns: {[normalize_column_name(col) for col in df.columns]}")
    
    return df

def aggregate_financial_fields(df: pd.DataFrame) -> pd.DataFrame:
    """Add aggregated financial fields required by financial calculations"""
    
    # Create total_income if not present
    if 'total_income' not in df.columns:
        income_fields = []
        for col in df.columns:
            col_lower = col.lower()
            if any(term in col_lower for term in ['income', 'revenue', 'rental', 'gross']):
                if 'expense' not in col_lower and 'ratio' not in col_lower:
                    income_fields.append(col)
        
        if income_fields:
            logger.info(f"Aggregating income fields: {income_fields}")
            df['total_income'] = df[income_fields].sum(axis=1, numeric_only=True)
        else:
            # Fallback to specific known fields
            potential_income = ['effective_gross_income', 'other_income', 'rental_income']
            available_income = [col for col in potential_income if col in df.columns]
            if available_income:
                logger.info(f"Using available income fields: {available_income}")
                df['total_income'] = df[available_income].sum(axis=1, numeric_only=True)
    
    # Create total_expenses if not present  
    if 'total_expenses' not in df.columns:
        expense_fields = []
        for col in df.columns:
            col_lower = col.lower()
            if 'expense' in col_lower and 'ratio' not in col_lower:
                expense_fields.append(col)
        
        if expense_fields:
            logger.info(f"Aggregating expense fields: {expense_fields}")
            df['total_expenses'] = df[expense_fields].sum(axis=1, numeric_only=True)
        else:
            # Fallback to specific patterns
            potential_expenses = [col for col in df.columns if col.lower().startswith('expense_')]
            if potential_expenses:
                logger.info(f"Using expense fields: {potential_expenses}")
                df['total_expenses'] = df[potential_expenses].sum(axis=1, numeric_only=True)
    
    return df


def detect_file_type_and_ingest(file_path: str) -> pd.DataFrame:
    """
    Inspect the file extension, call appropriate reader, apply alias mapping, and aggregate fields.
    Currently supports: .csv, .xlsx/.xls, .json, .txt (tab-delimited), .xml (simple).

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the extension is unsupported or parsing fails.
    """
    if not os.path.isfile(file_path):
        msg = f"Input file not found: {file_path}"
        logger.error(msg)
        raise FileNotFoundError(msg)

    _, ext = os.path.splitext(file_path.lower())

    try:
        # Step 1: Read the raw data
        if ext == ".csv":
            logger.info(f"Reading CSV: {file_path}")
            df = pd.read_csv(file_path)

        elif ext in [".xlsx", ".xls"]:
            logger.info(f"Reading Excel: {file_path}")
            df = pd.read_excel(file_path)

        elif ext == ".json":
            logger.info(f"Reading JSON: {file_path}")
            df = pd.read_json(file_path)

        elif ext == ".txt":
            logger.info(f"Reading TXT (tab-delimited): {file_path}")
            df = pd.read_csv(file_path, sep="\t")

        elif ext == ".xml":
            logger.info(f"Reading XML: {file_path}")
            # For simple XML conversions; may need lxml or xml.etree for complex structures
            df = pd.read_xml(file_path)

        else:
            msg = f"Unsupported file extension '{ext}' for file: {file_path}"
            logger.error(msg)
            raise ValueError(msg)

        # Step 2: Apply alias mapping to normalize column names
        logger.info(f"Original columns: {list(df.columns)}")
        df = apply_alias_mapping(df)
        logger.info(f"After alias mapping: {list(df.columns)}")
        
        # Step 3: Aggregate financial fields for downstream processing
        df = aggregate_financial_fields(df)
        logger.info(f"Final columns after aggregation: {list(df.columns)}")
        
        return df

    except Exception as e:
        logger.error(f"Failed to ingest file '{file_path}': {e}")
        raise
