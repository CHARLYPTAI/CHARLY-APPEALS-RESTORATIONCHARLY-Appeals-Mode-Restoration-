"""
alias_mapper.py

Loads and validates an external alias map (alias_map.json) against a JSON schema (alias_map_schema.json).
Provides functions to clean raw CSV headers and map them to standard model fields.

Additionally, logs any changes (diffs) to a change log file with timestamp metadata.

Author: CHARLY AI Assistant
"""

import os
import re
import json
import logging
from datetime import datetime
from typing import Dict, Any
from jsonschema import validate, ValidationError

# -------------------------
# Configuration
# -------------------------
# Paths to the JSON files (config files are in parent config directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(BASE_DIR, "config")
ALIAS_MAP_PATH = os.path.join(CONFIG_DIR, "alias_map.json")
ALIAS_SCHEMA_PATH = os.path.join(CONFIG_DIR, "alias_map_schema.json")
CHANGE_LOG_PATH = os.path.join(BASE_DIR, "charly_ingest", "alias_map_changes.log")

# Logger setup
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# -------------------------
# Utility Functions
# -------------------------
def load_json_file(file_path: str) -> Any:
    """
    Load and parse a JSON file. Raises an exception if it cannot be parsed.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def log_change(old_map: Dict[str, str], new_map: Dict[str, str]):
    """
    Compare old and new alias maps and append a diff record to CHANGE_LOG_PATH.
    Records timestamp and keys added/removed/modified.
    """
    timestamp = datetime.utcnow().isoformat()
    old_keys = set(old_map.keys())
    new_keys = set(new_map.keys())

    added_keys = new_keys - old_keys
    removed_keys = old_keys - new_keys
    modified_keys = {key for key in old_keys & new_keys if old_map[key] != new_map[key]}

    diff_record = {
        "timestamp": timestamp,
        "added": {k: new_map[k] for k in added_keys},
        "removed": {k: old_map[k] for k in removed_keys},
        "modified": {k: {"old": old_map[k], "new": new_map[k]} for k in modified_keys},
    }

    with open(CHANGE_LOG_PATH, "a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(diff_record) + "\n")

    logger.info(
        f"Alias map change logged at {timestamp}. "
        f"Added: {list(added_keys)}, Removed: {list(removed_keys)}, Modified: {list(modified_keys)}"
    )


# -------------------------
# Main AliasLoader Class
# -------------------------
class AliasLoader:
    """
    Loads and validates alias_map.json against alias_map_schema.json.
    Exposes `alias_map` dictionary and `clean_and_map` method.
    """

    def __init__(
        self, map_path: str = ALIAS_MAP_PATH, schema_path: str = ALIAS_SCHEMA_PATH
    ):
        self.map_path = map_path
        self.schema_path = schema_path
        self.alias_map: Dict[str, str] = {}
        self._load_and_validate()

    def _load_and_validate(self):
        """
        Load alias_map.json, validate against the JSON schema, and record any changes.
        """
        # Step 1: Load schema
        try:
            schema = load_json_file(self.schema_path)
        except Exception as e:
            logger.error(f"Failed to load schema from {self.schema_path}: {e}")
            raise

        # Step 2: Load the alias map JSON
        try:
            new_map = load_json_file(self.map_path)
        except Exception as e:
            logger.error(f"Failed to load alias map from {self.map_path}: {e}")
            raise

        # Step 3: Validate against schema
        try:
            validate(instance=new_map, schema=schema)
        except ValidationError as ve:
            logger.error(f"alias_map.json validation error: {ve.message}")
            raise

        # Step 4: If we have a previously loaded map, check for diffs
        if self.alias_map:
            log_change(self.alias_map, new_map)

        # Step 5: Assign the validated map
        self.alias_map = new_map
        logger.info(
            f"Alias map loaded successfully with {len(self.alias_map)} entries."
        )

    @staticmethod
    def clean_key(raw_key: str) -> str:
        """
        Convert a raw CSV header into cleaned form:
        - Lowercase
        - Remove spaces, underscores, dashes, and percent signs
        """
        key = raw_key.lower()
        key = re.sub(r"[\s_%\-]", "", key)
        return key

    def clean_and_map(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Given a raw CSV row (dict of {header: value}), produce a normalized dict
        where keys are standard field names as defined by alias_map.
        """
        normalized: Dict[str, Any] = {}
        for raw_key, value in row.items():
            cleaned = self.clean_key(raw_key)
            # Find which canonical field this raw key maps to
            for canonical_field, aliases in self.alias_map.items():
                if cleaned in [self.clean_key(alias) for alias in aliases]:
                    normalized[canonical_field] = value
                    break
        return normalized


# Instantiate a global loader for easy import
alias_loader = AliasLoader()


def normalize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to expose clean_and_map functionality.
    """
    return alias_loader.clean_and_map(row)
