# pdf_ingest.py

import pdfplumber
from alias_mapper import map_fields
from utils import log_info, log_error
import pandas as pd
from datetime import datetime


def parse_date(date_str):
    if pd.isna(date_str):
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(str(date_str), fmt).date()
        except ValueError:
            continue
    return None


def ingest_pdf(file_path):
    try:
        log_info(f"Loading PDF file: {file_path}")
        text_data = []

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_data.append(text)

        full_text = "\n".join(text_data)
        log_info(f"Extracted text length: {len(full_text)} characters")

        # For now, wrap full text into a DataFrame
        df = pd.DataFrame({"extracted_text": [full_text]})

        # Note: If PDF contains structured tables, implement parsing here.
        # This is a placeholder since complex PDF parsing varies widely.

        return df

    except Exception as e:
        log_error(f"Failed to load PDF file: {e}")
        raise
