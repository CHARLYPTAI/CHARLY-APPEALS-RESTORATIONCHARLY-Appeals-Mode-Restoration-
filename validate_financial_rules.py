#!/usr/bin/env python3
"""
Validation script for financial_rules.json configuration file
"""

import json
import jsonschema
import sys
from pathlib import Path


def validate_financial_rules():
    """Validate financial_rules.json against its schema"""
    config_dir = Path("config")
    
    # Load schema
    schema_path = config_dir / "financial_rules_schema.json"
    if not schema_path.exists():
        print(f"ERROR: Schema file not found: {schema_path}")
        return False
    
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    
    # Load financial rules
    financial_rules_path = config_dir / "financial_rules.json"
    if not financial_rules_path.exists():
        print(f"ERROR: Financial rules file not found: {financial_rules_path}")
        return False
    
    with open(financial_rules_path, 'r') as f:
        financial_rules = json.load(f)
    
    # Validate
    try:
        jsonschema.validate(financial_rules, schema)
        print("✅ financial_rules.json is valid")
        return True
    except jsonschema.ValidationError as e:
        print(f"❌ financial_rules.json validation failed: {e.message}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = validate_financial_rules()
    sys.exit(0 if success else 1)