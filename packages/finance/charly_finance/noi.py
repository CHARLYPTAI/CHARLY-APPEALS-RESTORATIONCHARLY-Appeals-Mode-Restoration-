"""Net Operating Income calculations for commercial properties."""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator


class NOIInput(BaseModel):
    """Input data for NOI calculation."""
    
    gross_rental_income: Decimal = Field(..., ge=0, description="Annual gross rental income")
    vacancy_rate: Decimal = Field(0.05, ge=0, le=1, description="Vacancy rate as decimal (default 5%)")
    other_income: Decimal = Field(0, ge=0, description="Other income (parking, laundry, etc)")
    
    # Operating expenses
    property_taxes: Decimal = Field(0, ge=0, description="Annual property taxes")
    insurance: Decimal = Field(0, ge=0, description="Annual insurance costs")
    maintenance: Decimal = Field(0, ge=0, description="Annual maintenance costs")
    utilities: Decimal = Field(0, ge=0, description="Annual utility costs")
    management_fees: Decimal = Field(0, ge=0, description="Annual management fees")
    other_expenses: Decimal = Field(0, ge=0, description="Other operating expenses")
    
    @validator("vacancy_rate")
    def validate_vacancy_rate(cls, v):
        if v > 0.5:  # 50% vacancy seems unrealistic for analysis
            raise ValueError("Vacancy rate cannot exceed 50%")
        return v
    
    @validator("*", pre=True)
    def convert_to_decimal(cls, v):
        if isinstance(v, (int, float, str)):
            return Decimal(str(v))
        return v


class NOIResult(BaseModel):
    """Result of NOI calculation."""
    
    effective_gross_income: Decimal = Field(..., description="Gross income minus vacancy")
    total_operating_expenses: Decimal = Field(..., description="Sum of all operating expenses")
    net_operating_income: Decimal = Field(..., description="EGI minus operating expenses")
    
    # Breakdown for transparency
    vacancy_loss: Decimal = Field(..., description="Income lost to vacancy")
    expense_breakdown: Dict[str, Decimal] = Field(..., description="Detailed expense breakdown")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


def calculate_noi(input_data: NOIInput) -> NOIResult:
    """
    Calculate Net Operating Income for a commercial property.
    
    Formula: NOI = (Gross Income - Vacancy Loss + Other Income) - Operating Expenses
    
    Args:
        input_data: NOI calculation inputs
        
    Returns:
        NOIResult with calculated values
        
    Raises:
        ValueError: If inputs result in negative NOI beyond reasonable bounds
    """
    # Calculate effective gross income
    vacancy_loss = input_data.gross_rental_income * input_data.vacancy_rate
    effective_gross_income = (
        input_data.gross_rental_income 
        - vacancy_loss 
        + input_data.other_income
    )
    
    # Calculate total operating expenses
    expense_breakdown = {
        "property_taxes": input_data.property_taxes,
        "insurance": input_data.insurance,
        "maintenance": input_data.maintenance,
        "utilities": input_data.utilities,
        "management_fees": input_data.management_fees,
        "other_expenses": input_data.other_expenses,
    }
    
    total_operating_expenses = sum(expense_breakdown.values())
    
    # Calculate NOI
    net_operating_income = effective_gross_income - total_operating_expenses
    
    # Sanity check: NOI shouldn't be extremely negative relative to income
    if net_operating_income < -effective_gross_income:
        raise ValueError("Operating expenses exceed 200% of effective gross income - please verify inputs")
    
    # Round to nearest cent
    def round_currency(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    return NOIResult(
        effective_gross_income=round_currency(effective_gross_income),
        total_operating_expenses=round_currency(total_operating_expenses),
        net_operating_income=round_currency(net_operating_income),
        vacancy_loss=round_currency(vacancy_loss),
        expense_breakdown={k: round_currency(v) for k, v in expense_breakdown.items()}
    )