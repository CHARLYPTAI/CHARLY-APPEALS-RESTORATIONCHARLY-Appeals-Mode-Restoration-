#!/usr/bin/env python3
"""
Validation script for flag_rules.json configuration file
"""

import json
import jsonschema
import sys
from pathlib import Path


def validate_flag_rules():
    """Validate flag_rules.json against its schema"""
    config_dir = Path("config")
    
    # Load schema
    schema_path = config_dir / "flag_rules_schema.json"
    if not schema_path.exists():
        print(f"ERROR: Schema file not found: {schema_path}")
        return False
    
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    
    # Load flag rules
    flag_rules_path = config_dir / "flag_rules.json"
    if not flag_rules_path.exists():
        print(f"ERROR: Flag rules file not found: {flag_rules_path}")
        return False
    
    with open(flag_rules_path, 'r') as f:
        flag_rules = json.load(f)
    
    # Validate
    try:
        jsonschema.validate(flag_rules, schema)
        print("✅ flag_rules.json is valid")
        return True
    except jsonschema.ValidationError as e:
        print(f"❌ flag_rules.json validation failed: {e.message}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = validate_flag_rules()
    sys.exit(0 if success else 1)