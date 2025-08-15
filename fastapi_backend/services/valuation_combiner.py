from typing import Dict, Any

# These imports are best-effort; if a service is missing, raise and let the 501 surface.
from fastapi_backend.services.income_service import get_income_valuation  # type: ignore
from fastapi_backend.services.sales_service import get_sales_valuation    # type: ignore
from fastapi_backend.services.cost_service import get_cost_valuation      # type: ignore

def _to_number(v: Any) -> float:
    try:
        return float(v)
    except Exception:
        return 0.0

def combine_all(prop_id: str) -> Dict[str, Any]:
    """
    Returns a deterministic, schema-friendly dict with:
    {
      "income": {..., "value": float},
      "sales": {..., "value": float},
      "cost":  {..., "value": float},
      "income_value": float,
      "sales_value": float,
      "cost_value": float
    }
    Each per-approach service is responsible for domain-accurate calcs.
    We only normalize shape and bubble up the final values.
    """
    income = get_income_valuation(prop_id) or {}
    sales  = get_sales_valuation(prop_id) or {}
    cost   = get_cost_valuation(prop_id) or {}

    income_value = _to_number(income.get("value"))
    sales_value  = _to_number(sales.get("value"))
    cost_value   = _to_number(cost.get("value"))

    return {
        "income": income,
        "sales": sales,
        "cost":  cost,
        "income_value": income_value,
        "sales_value": sales_value,
        "cost_value": cost_value,
    }
