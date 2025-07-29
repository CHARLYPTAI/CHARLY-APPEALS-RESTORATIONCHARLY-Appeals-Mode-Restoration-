#!/usr/bin/env python3
"""
Validation script for alias_map.json configuration file
"""

import json
import jsonschema
import sys
from pathlib import Path


def validate_alias_map():
    """Validate alias_map.json against its schema"""
    config_dir = Path("config")
    
    # Load schema
    schema_path = config_dir / "alias_map_schema.json"
    if not schema_path.exists():
        print(f"ERROR: Schema file not found: {schema_path}")
        return False
    
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    
    # Load alias map
    alias_map_path = config_dir / "alias_map.json"
    if not alias_map_path.exists():
        print(f"ERROR: Alias map file not found: {alias_map_path}")
        return False
    
    with open(alias_map_path, 'r') as f:
        alias_map = json.load(f)
    
    # Validate
    try:
        jsonschema.validate(alias_map, schema)
        print("✅ alias_map.json is valid")
        return True
    except jsonschema.ValidationError as e:
        print(f"❌ alias_map.json validation failed: {e.message}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = validate_alias_map()
    sys.exit(0 if success else 1)