import streamlit as st
import json
import os
import jsonschema
from datetime import datetime
from pathlib import Path

# === SCHEMA VALIDATION ===
SCHEMA_FILE = 'rules_config.schema.json'

with open(SCHEMA_FILE, 'r') as f:
    rules_schema = json.load(f)

def validate_rule_set(rules):
    try:
        jsonschema.validate(instance=rules, schema=rules_schema)
        return True, ""
    except jsonschema.ValidationError as e:
        return False, str(e)

# === RULE MANAGEMENT ===
RULES_FILE = 'rules_config.json'
CHANGE_LOG_FILE = 'rules_change_log.txt'

def load_rules():
    if not Path(RULES_FILE).exists():
        return {}
    with open(RULES_FILE, 'r') as f:
        return json.load(f)

def save_rules(rules):
    with open(RULES_FILE, 'w') as f:
        json.dump(rules, f, indent=2)

def log_change(user, old_rules, new_rules):
    timestamp = datetime.now().isoformat()
    diff = json.dumps(new_rules, indent=2)
    with open(CHANGE_LOG_FILE, 'a') as f:
        f.write(f"{timestamp} | {user}\n{diff}\n{'-'*40}\n")

# === STREAMLIT UI ===
st.title("CHARLY Rules Config Editor")

rules = load_rules()
user = os.getenv("USER", "georgewohlleb")  # Use system user or default

st.subheader("Add / Edit Rules")

county = st.text_input("County Name")
key = st.text_input("Rule Key")
value_json_str = st.text_area("Rule Value (JSON)")

if st.button("Save Rule"):
    try:
        value_json = json.loads(value_json_str)
        if county not in rules:
            rules[county] = {}
        old_rules = rules.copy()
        rules[county][key] = value_json
        is_valid, error_msg = validate_rule_set(rules)
        if is_valid:
            save_rules(rules)
            log_change(user, old_rules, rules)
            st.success(f"Rule for {county} saved.")
        else:
            rules = old_rules
            st.error(f"Schema validation failed: {error_msg}")
    except json.JSONDecodeError as e:
        st.error(f"Invalid JSON format: {e}")

st.subheader("Change Log")

if Path(CHANGE_LOG_FILE).exists():
    with open(CHANGE_LOG_FILE, 'r') as f:
        log_content = f.read()
    st.text_area("Change Log", log_content, height=300)
else:
    st.info("No changes logged yet.")
