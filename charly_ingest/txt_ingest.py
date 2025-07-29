# txt_ingest.py

from utils import log_info, log_error
import pandas as pd


def ingest_txt(file_path):
    try:
        log_info(f"Loading TXT file: {file_path}")
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        log_info(f"Loaded text length: {len(content)} characters")

        # Wrap text into DataFrame for consistency
        df = pd.DataFrame({"extracted_text": [content]})
        return df

    except Exception as e:
        log_error(f"Failed to load TXT file: {e}")
        raise
