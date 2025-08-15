.PHONY: test-golden update-golden test-schema
test-golden:
pytest -q tests/golden

update-golden:
@echo "Using BACKEND_BASE_URL=${BACKEND_BASE_URL:-http://localhost:8000}"
python3 tests/golden/update_baselines.py

test-schema:
RUN_SCHEMA_TESTS=1 pytest -q tests/schema
