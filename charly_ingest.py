import os
import sys
import logging
import pandas as pd
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:%(message)s"
)

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHARLY_SSH_KEY = os.getenv("CHARLY_SSH_KEY")
UPLOAD_KEY = os.getenv("UPLOAD_KEY")

missing = []
if not OPENAI_API_KEY:
    missing.append("OPENAI_API_KEY")
if not CHARLY_SSH_KEY:
    missing.append("CHARLY_SSH_KEY")
if not UPLOAD_KEY:
    missing.append("UPLOAD_KEY")

if missing:
    logging.error(f"Missing environment variables: {', '.join(missing)}")
    sys.exit(1)

logging.info("All environment variables loaded successfully.")

# Pydantic model for validation
class PropertyRecord(BaseModel):
    property_id: str = Field(..., description="Unique property identifier")
    address: str = Field(..., description="Property address")
    assessment_value: float = Field(..., gt=0, description="Assessed value")

# Aliases for dynamic field mapping
FIELD_ALIASES = {
    "property_id": ["property_id", "parcel_id", "id", "prop_id"],
    "address": ["address", "property_address", "location"],
    "assessment_value": ["assessment_value", "assessed_val", "assessed_value", "value"]
}

def map_fields(columns):
    col_map = {}
    for internal_name, aliases in FIELD_ALIASES.items():
        for alias in aliases:
            if alias in columns:
                col_map[alias] = internal_name
                break
    return col_map

def ingest_csv(file_path):
    try:
        logging.info(f"Loading CSV file: {file_path}")
        df = pd.read_csv(file_path)
        logging.info(f"Original columns: {list(df.columns)}")
        col_map = map_fields(df.columns)
        df = df.rename(columns=col_map)
        logging.info(f"Mapped columns: {list(df.columns)}")
        logging.info(f"Loaded {len(df)} rows")

        # Convert property_id to string explicitly
        if 'property_id' in df.columns:
            df['property_id'] = df['property_id'].astype(str)

        # Validate each row with Pydantic model
        valid_records = []
        errors = 0
        for _, row in df.iterrows():
            try:
                record = PropertyRecord(**row.to_dict())
                valid_records.append(record)
            except ValidationError as ve:
                logging.error(f"Validation error for row {_}: {ve}")
                errors += 1

        logging.info(f"Validation complete: {len(valid_records)} valid records, {errors} errors.")

        return valid_records
    except FileNotFoundError:
        logging.error(f"File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Failed to load CSV file: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        logging.error("Usage: python charly_ingest.py <input_csv_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    records = ingest_csv(input_file)
    logging.info(f"Finished ingesting {len(records)} records.")

    # Placeholder: proceed with further processing of 'records'

if __name__ == "__main__":
    main()
