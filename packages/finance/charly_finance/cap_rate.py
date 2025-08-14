"""Cap rate calculations for commercial property valuation."""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from pydantic import BaseModel, Field, validator


class CapRateInput(BaseModel):
    """Input data for cap rate calculation."""
    
    net_operating_income: Decimal = Field(..., description="Annual NOI")
    property_value: Optional[Decimal] = Field(None, ge=0, description="Property value (if calculating cap rate)")
    target_cap_rate: Optional[Decimal] = Field(None, gt=0, le=1, description="Target cap rate (if calculating value)")
    
    @validator("target_cap_rate")
    def validate_cap_rate(cls, v):
        if v is not None and (v <= 0 or v > 0.5):  # 0% to 50% reasonable range
            raise ValueError("Cap rate must be between 0% and 50%")
        return v
        
    @validator("*", pre=True)
    def convert_to_decimal(cls, v):
        if isinstance(v, (int, float, str)):
            return Decimal(str(v))
        return v
    
    @validator("net_operating_income")
    def validate_noi(cls, v):
        # Allow negative NOI for analysis but warn about it in results
        return v


class CapRateResult(BaseModel):
    """Result of cap rate calculation."""
    
    cap_rate: Optional[Decimal] = Field(None, description="Calculated cap rate")
    implied_value: Optional[Decimal] = Field(None, description="Value implied by NOI and target cap rate")
    noi_used: Decimal = Field(..., description="NOI used in calculation")
    
    # Analysis flags
    negative_noi_warning: bool = Field(False, description="True if NOI was negative")
    cap_rate_quality: str = Field(..., description="Assessment of cap rate reasonableness")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


def calculate_cap_rate(input_data: CapRateInput) -> CapRateResult:
    """
    Calculate cap rate or implied property value.
    
    Cap Rate = NOI / Property Value
    Property Value = NOI / Cap Rate
    
    Args:
        input_data: Cap rate calculation inputs
        
    Returns:
        CapRateResult with calculated values
        
    Raises:
        ValueError: If neither property_value nor target_cap_rate provided
    """
    if input_data.property_value is None and input_data.target_cap_rate is None:
        raise ValueError("Must provide either property_value or target_cap_rate")
    
    if input_data.property_value is not None and input_data.target_cap_rate is not None:
        raise ValueError("Provide either property_value OR target_cap_rate, not both")
    
    negative_noi_warning = input_data.net_operating_income < 0
    
    def round_currency(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def round_percentage(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)  # 4 decimal places for percentages
    
    # Calculate cap rate from property value
    if input_data.property_value is not None:
        if input_data.property_value == 0:
            raise ValueError("Property value cannot be zero")
            
        cap_rate = input_data.net_operating_income / input_data.property_value
        
        # Assess cap rate quality
        if negative_noi_warning:
            quality = "NEGATIVE_NOI"
        elif cap_rate < Decimal('0.02'):  # < 2%
            quality = "VERY_LOW"
        elif cap_rate < Decimal('0.04'):  # 2-4%
            quality = "LOW" 
        elif cap_rate <= Decimal('0.12'):  # 4-12%
            quality = "REASONABLE"
        elif cap_rate <= Decimal('0.20'):  # 12-20%
            quality = "HIGH"
        else:  # > 20%
            quality = "VERY_HIGH"
            
        return CapRateResult(
            cap_rate=round_percentage(cap_rate),
            implied_value=None,
            noi_used=round_currency(input_data.net_operating_income),
            negative_noi_warning=negative_noi_warning,
            cap_rate_quality=quality
        )
    
    # Calculate implied value from target cap rate
    else:  # target_cap_rate is not None
        if negative_noi_warning:
            # For negative NOI, still calculate but flag it
            implied_value = input_data.net_operating_income / input_data.target_cap_rate
            quality = "NEGATIVE_NOI"
        else:
            implied_value = input_data.net_operating_income / input_data.target_cap_rate
            quality = "CALCULATED_VALUE"
            
        return CapRateResult(
            cap_rate=None,
            implied_value=round_currency(implied_value),
            noi_used=round_currency(input_data.net_operating_income),
            negative_noi_warning=negative_noi_warning,
            cap_rate_quality=quality
        )