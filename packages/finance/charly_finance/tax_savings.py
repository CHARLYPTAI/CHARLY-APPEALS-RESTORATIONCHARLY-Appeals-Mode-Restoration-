"""Property tax savings calculations for appeals."""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from pydantic import BaseModel, Field, validator


class TaxSavingsInput(BaseModel):
    """Input data for tax savings calculation."""
    
    current_assessed_value: Decimal = Field(..., gt=0, description="Current assessed value")
    proposed_assessed_value: Decimal = Field(..., gt=0, description="Proposed/target assessed value")
    tax_rate: Decimal = Field(..., gt=0, description="Tax rate per $1000 or mill rate")
    tax_rate_per_thousand: bool = Field(True, description="True if tax rate is per $1000, False if mill rate")
    
    # Appeal costs and timeline
    filing_fee: Decimal = Field(0, ge=0, description="Appeal filing fee")
    attorney_fee: Decimal = Field(0, ge=0, description="Attorney/consultant fee")
    other_costs: Decimal = Field(0, ge=0, description="Other appeal-related costs")
    years_of_savings: int = Field(1, ge=1, le=10, description="Years to calculate savings for")
    
    @validator("proposed_assessed_value")
    def validate_proposed_value(cls, v, values):
        # Allow increases for "Under" scenarios but flag them
        return v
    
    @validator("tax_rate")
    def validate_tax_rate(cls, v, values):
        rate_type = values.get("tax_rate_per_thousand", True)
        if rate_type and v > 200:  # $200 per $1000 seems unrealistic
            raise ValueError("Tax rate per $1000 seems too high (>$200)")
        elif not rate_type and v > 200:  # 200 mills = 20% also unrealistic
            raise ValueError("Mill rate seems too high (>200 mills)")
        return v
        
    @validator("*", pre=True)  
    def convert_to_decimal(cls, v):
        if isinstance(v, (int, float, str)):
            return Decimal(str(v))
        return v


class TaxSavingsResult(BaseModel):
    """Result of tax savings calculation."""
    
    annual_tax_current: Decimal = Field(..., description="Current annual tax")
    annual_tax_proposed: Decimal = Field(..., description="Proposed annual tax")
    annual_savings: Decimal = Field(..., description="Annual tax savings")
    
    total_appeal_costs: Decimal = Field(..., description="Total costs to appeal")
    net_first_year_savings: Decimal = Field(..., description="First year savings minus costs")
    cumulative_savings: Decimal = Field(..., description="Total savings over specified years")
    
    # Analysis metrics
    payback_period_years: Optional[Decimal] = Field(None, description="Years to recoup appeal costs")
    roi_percentage: Optional[Decimal] = Field(None, description="ROI as percentage") 
    
    # Flags for decision making
    value_increase_warning: bool = Field(False, description="True if proposed value is higher")
    negative_savings_warning: bool = Field(False, description="True if appeal would increase taxes")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


def calculate_tax_savings(input_data: TaxSavingsInput) -> TaxSavingsResult:
    """
    Calculate potential tax savings from a successful appeal.
    
    Args:
        input_data: Tax savings calculation inputs
        
    Returns:
        TaxSavingsResult with calculated savings and metrics
    """
    def round_currency(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def round_percentage(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Calculate effective tax rate (convert to decimal)
    if input_data.tax_rate_per_thousand:
        effective_rate = input_data.tax_rate / Decimal('1000')
    else:
        # Mill rate: 1 mill = $1 per $1000 of value
        effective_rate = input_data.tax_rate / Decimal('1000')
    
    # Calculate annual taxes
    annual_tax_current = input_data.current_assessed_value * effective_rate
    annual_tax_proposed = input_data.proposed_assessed_value * effective_rate
    annual_savings = annual_tax_current - annual_tax_proposed
    
    # Calculate total costs
    total_appeal_costs = (
        input_data.filing_fee + 
        input_data.attorney_fee + 
        input_data.other_costs
    )
    
    # Calculate net savings
    net_first_year_savings = annual_savings - total_appeal_costs
    cumulative_savings = (annual_savings * input_data.years_of_savings) - total_appeal_costs
    
    # Analysis flags
    value_increase_warning = input_data.proposed_assessed_value > input_data.current_assessed_value
    negative_savings_warning = annual_savings < 0
    
    # Calculate payback period and ROI
    payback_period_years = None
    roi_percentage = None
    
    if annual_savings > 0 and total_appeal_costs > 0:
        payback_period_years = round_currency(total_appeal_costs / annual_savings)
        
    if total_appeal_costs > 0:
        # ROI = (Total Benefit - Total Cost) / Total Cost
        total_benefit = annual_savings * input_data.years_of_savings
        roi = ((total_benefit - total_appeal_costs) / total_appeal_costs) * 100
        roi_percentage = round_percentage(roi)
    
    return TaxSavingsResult(
        annual_tax_current=round_currency(annual_tax_current),
        annual_tax_proposed=round_currency(annual_tax_proposed),
        annual_savings=round_currency(annual_savings),
        
        total_appeal_costs=round_currency(total_appeal_costs),
        net_first_year_savings=round_currency(net_first_year_savings),
        cumulative_savings=round_currency(cumulative_savings),
        
        payback_period_years=payback_period_years,
        roi_percentage=roi_percentage,
        
        value_increase_warning=value_increase_warning,
        negative_savings_warning=negative_savings_warning
    )