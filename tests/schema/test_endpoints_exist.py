import os, requests, pytest

BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

@pytest.mark.parametrize("path", [
    "/api/valuation/OBZ-2023-001/combined",
    "/api/appeals/OBZ-2023-001/narrative",
    "/api/appeals/OBZ-2023-001/packet/export?format=pdf",
])
def test_golden_endpoints_exist(path):
    r = requests.get(BASE_URL + path, timeout=15)
    assert r.status_code in (200, 501), f"{path} should exist; got {r.status_code}"
