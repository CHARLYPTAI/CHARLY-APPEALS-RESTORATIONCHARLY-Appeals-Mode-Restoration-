# models.py

from typing import Optional, List, Dict
from datetime import date
from pydantic import BaseModel, Field


class PropertyRecord(BaseModel):
    property_id: str = Field(..., description="Unique property identifier")
    address: str = Field(..., description="Property address")
    parcel_number: Optional[str] = Field(
        None, description="Official parcel/tax lot number"
    )
    jurisdiction: Optional[str] = Field(None, description="Tax jurisdiction or county")

    assessment_value: float = Field(..., gt=0, description="Current assessed value")
    market_value: Optional[float] = Field(None, description="Estimated market value")
    last_sale_price: Optional[float] = Field(None, description="Last sale price")
    last_sale_date: Optional[date] = Field(None, description="Date of last sale")
    assessment_date: Optional[date] = Field(None, description="Date of assessment")

    age: Optional[int] = Field(None, ge=0, description="Building age in years")
    building_size: Optional[float] = Field(None, description="Building size in sq ft")
    lot_size: Optional[float] = Field(None, description="Land parcel size")
    number_of_units: Optional[int] = Field(None, description="Number of rental units")
    property_type: Optional[str] = Field(None, description="Property type")

    gross_income: Optional[float] = Field(None, description="Gross rental income")
    net_operating_income: Optional[float] = Field(None, description="NOI")
    vacancy_rate: Optional[float] = Field(
        None, ge=0, le=1, description="Vacancy rate (0-1)"
    )
    expense_ratio: Optional[float] = Field(
        None, ge=0, le=1, description="Expense ratio (0-1)"
    )
    operating_expenses: Optional[float] = Field(None, description="Operating expenses")
    capital_expenditures: Optional[float] = Field(
        None, description="Capital expenditures"
    )
    lease_type: Optional[str] = Field(None, description="Lease type (e.g., triple-net)")

    cap_rate: Optional[float] = Field(None, description="Capitalization rate")
    comparable_sales: Optional[List[Dict]] = Field(
        None, description="Comparable sales data"
    )
    neighborhood: Optional[str] = Field(None, description="Neighborhood or market area")
    zoning: Optional[str] = Field(None, description="Zoning classification")
    accessibility: Optional[str] = Field(None, description="Accessibility notes")

    condition: Optional[str] = Field(None, description="Property condition")
    depreciation: Optional[float] = Field(None, description="Accumulated depreciation")
    last_renovation_date: Optional[date] = Field(
        None, description="Date of last renovation"
    )

    tax_class: Optional[str] = Field(None, description="Tax class")
    exemptions: Optional[List[str]] = Field(None, description="Tax exemptions")
    appeal_status: Optional[str] = Field(None, description="Appeal status")
    assessment_history: Optional[List[Dict]] = Field(
        None, description="Historical assessment values"
    )

    special_conditions: Optional[str] = Field(
        None, description="Special conditions or notes"
    )
    owner_type: Optional[str] = Field(None, description="Owner type")
    risk_flags: Optional[List[str]] = Field(None, description="Risk flags")
