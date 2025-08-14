import os
import pandas as pd
from pydantic import BaseModel, ValidationError
from typing import Dict, List
import logging

# Setup logging
logging.basicConfig(
    filename="charly_ingestion.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:%(message)s",
)

alias_config: Dict[str, List[str]] = {
    "parcel_id": ["ParcelID", "parcel_number", "PID"],
    "address": ["Address", "property_address", "Addr"],
    "assessed_value": ["AssessedValue", "Value", "AV"],
}

def apply_field_aliases(df: pd.DataFrame, alias_map: Dict[str, List[str]]) -> pd.DataFrame:
    col_renames = {}
    lower_cols = {col.lower(): col for col in df.columns}

    for std_field, aliases in alias_map.items():
        for alias in aliases:
            if alias.lower() in lower_cols:
                col_renames[lower_cols[alias.lower()]] = std_field
                break

    if col_renames:
        df = df.rename(columns=col_renames)
        logging.info(f"Applied field aliases: {col_renames}")
    else:
        logging.info("No field aliases applied.")
    return df

class PropertyRecord(BaseModel):
    parcel_id: str
    address: str
    assessed_value: float

def flag_record(record: PropertyRecord) -> Dict[str, bool]:
    flags = {}
    flags['high_assessed_value'] = record.assessed_value > 1_000_000
    flags['missing_address'] = not bool(record.address.strip())
    return flags

def load_property_data(filepath: str) -> pd.DataFrame:
    _, ext = os.path.splitext(filepath.lower())
    if ext == ".csv":
        df = pd.read_csv(filepath)
    elif ext == ".json":
        df = pd.read_json(filepath)
    elif ext == ".xlsx":
        df = pd.read_excel(filepath)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
    logging.info(f"Loaded file '{filepath}' with shape {df.shape}")
    return df

def ingest_validate_flag(filepath: str):
    try:
        df = load_property_data(filepath)
    except Exception as e:
        logging.error(f"Failed to load file '{filepath}': {e}")
        print(f"ERROR: Failed to load file '{filepath}': {e}")
        return [], []

    df = apply_field_aliases(df, alias_config)

    validated_records = []
    flagged_records = []
    errors = []

    for idx, row in df.iterrows():
        try:
            record = PropertyRecord(**row.to_dict())
            validated_records.append(record)
            flags = flag_record(record)
            flagged_records.append({'record': record, 'flags': flags})
        except ValidationError as ve:
            error_msg = f"Row {idx} validation error: {ve}"
            errors.append((idx, ve))
            logging.warning(error_msg)
            print(f"WARNING: {error_msg} -- skipping row")

    logging.info(f"Ingestion complete: {len(validated_records)} valid rows, {len(errors)} errors")
    print(f"Ingestion complete: {len(validated_records)} valid rows, {len(errors)} errors")
    return flagged_records, errors

if __name__ == "__main__":
    test_file = "sample_data.xlsx"  # Update this to your file path
    flagged, errors = ingest_validate_flag(test_file)

    print("\nSample flagged records (up to 3):")
    for entry in flagged[:3]:
        print(f"Parcel {entry['record'].parcel_id} Flags: {entry['flags']}")

    if errors:
        print("\nSample validation errors (up to 3):")
        for idx, err in errors[:3]:
            print(f"Row {idx}: {err}")
