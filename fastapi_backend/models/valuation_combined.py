from pydantic import BaseModel, Field
from typing import Dict, Any

class CombinedValuation(BaseModel):
    property_id: str = Field(...)
    income_value: float
    sales_value: float
    cost_value: float
    income: Dict[str, Any]
    sales: Dict[str, Any]
    cost: Dict[str, Any]
