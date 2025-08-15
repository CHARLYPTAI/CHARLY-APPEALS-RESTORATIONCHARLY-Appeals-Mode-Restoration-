import json, os
import pytest, requests
from jsonschema import validate, Draft202012Validator

BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

@pytest.mark.skipif(not os.getenv("RUN_SCHEMA_TESTS","1")=="1", reason="Set RUN_SCHEMA_TESTS=1 to run schema tests")
def test_combined_endpoint_conforms_to_schema():
    schema_path = "fastapi_backend/schemas/valuation_combined.schema.json"
    assert os.path.exists(schema_path), "Missing schema file"
    schema = json.load(open(schema_path, "r"))

    for prop_id in ("OBZ-2023-001","ABC-2023-002"):
        r = requests.get(f"{BASE_URL}/api/valuation/{prop_id}/combined", timeout=30)
        assert r.status_code == 200, f"GET combined failed: {r.status_code} {r.text}"
        data = r.json()
        Draft202012Validator.check_schema(schema)
        validate(instance=data, schema=schema)
