"""Confidence band calculations for property valuations."""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field, validator
from enum import Enum


class ValuationMethod(str, Enum):
    """Methods used for property valuation."""
    SALES_COMPARISON = "sales_comparison"
    INCOME_APPROACH = "income_approach" 
    COST_APPROACH = "cost_approach"
    AUTOMATED_VALUATION = "automated_valuation"
    TAX_ASSESSOR = "tax_assessor"


class ConfidenceInput(BaseModel):
    """Input data for confidence band calculation."""
    
    estimated_market_value: Decimal = Field(..., gt=0, description="Primary estimated market value")
    valuation_method: ValuationMethod = Field(..., description="Primary valuation method used")
    
    # Supporting valuations (optional)
    comparable_sales: List[Decimal] = Field(default_factory=list, description="Recent comparable sale prices")
    other_estimates: List[Tuple[Decimal, ValuationMethod]] = Field(default_factory=list, description="Other valuation estimates")
    
    # Quality indicators
    data_quality_score: Decimal = Field(0.8, ge=0, le=1, description="Quality of underlying data (0-1)")
    market_conditions: str = Field("stable", description="Market conditions: stable, improving, declining")
    property_uniqueness: Decimal = Field(0.5, ge=0, le=1, description="Property uniqueness factor (0=common, 1=unique)")
    
    # Temporal factors
    valuation_date: Optional[str] = Field(None, description="Valuation date (YYYY-MM-DD)")
    days_since_valuation: int = Field(0, ge=0, le=1095, description="Days since valuation performed")
    
    @validator("market_conditions")
    def validate_market_conditions(cls, v):
        valid_conditions = {"stable", "improving", "declining", "volatile"}
        if v.lower() not in valid_conditions:
            raise ValueError(f"Market conditions must be one of: {valid_conditions}")
        return v.lower()
        
    @validator("other_estimates")
    def validate_other_estimates(cls, v):
        if len(v) > 10:  # Reasonable limit
            raise ValueError("Too many other estimates (max 10)")
        for estimate, method in v:
            if estimate <= 0:
                raise ValueError("All estimates must be positive")
        return v
        
    @validator("*", pre=True)
    def convert_to_decimal(cls, v):
        if isinstance(v, (int, float, str)) and any(field in cls.__annotations__ for field in ['estimated_market_value', 'data_quality_score', 'property_uniqueness']):
            return Decimal(str(v))
        return v


class ConfidenceResult(BaseModel):
    """Result of confidence band calculation."""
    
    central_estimate: Decimal = Field(..., description="Central value estimate")
    confidence_band_pct: Decimal = Field(..., description="Confidence band as percentage (+/-)")
    
    lower_bound: Decimal = Field(..., description="Lower confidence bound")
    upper_bound: Decimal = Field(..., description="Upper confidence bound")
    
    # Quality metrics
    confidence_score: Decimal = Field(..., ge=0, le=1, description="Overall confidence score (0-1)")
    reliability_grade: str = Field(..., description="A/B/C/D grade for reliability")
    
    # Supporting analysis
    estimate_dispersion: Optional[Decimal] = Field(None, description="Coefficient of variation of estimates")
    method_consistency: Decimal = Field(0, ge=0, le=1, description="Consistency across valuation methods")
    
    # Risk factors
    risk_factors: List[str] = Field(default_factory=list, description="Identified risk factors")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


def calculate_confidence_band(input_data: ConfidenceInput) -> ConfidenceResult:
    """
    Calculate confidence band around property value estimate.
    
    The confidence band reflects uncertainty in the valuation and is used
    to classify whether an assessment falls within reasonable bounds.
    
    Args:
        input_data: Confidence calculation inputs
        
    Returns:
        ConfidenceResult with bounds and quality metrics
    """
    
    def round_currency(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def round_percentage(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.001'), rounding=ROUND_HALF_UP)  # 3 decimal places
    
    # Start with base confidence band based on valuation method
    method_bands = {
        ValuationMethod.SALES_COMPARISON: Decimal('0.10'),    # ±10% for good comps
        ValuationMethod.INCOME_APPROACH: Decimal('0.15'),     # ±15% for income approach
        ValuationMethod.COST_APPROACH: Decimal('0.20'),       # ±20% for cost approach
        ValuationMethod.AUTOMATED_VALUATION: Decimal('0.25'), # ±25% for AVMs
        ValuationMethod.TAX_ASSESSOR: Decimal('0.30')         # ±30% for assessor estimates
    }
    
    base_band = method_bands[input_data.valuation_method]
    
    # Adjust for data quality
    quality_adjustment = (Decimal('1.0') - input_data.data_quality_score) * Decimal('0.15')
    adjusted_band = base_band + quality_adjustment
    
    # Adjust for market conditions
    market_adjustments = {
        "stable": Decimal('0.0'),
        "improving": Decimal('0.05'),  # More uncertainty in rising markets
        "declining": Decimal('0.08'),  # More uncertainty in falling markets
        "volatile": Decimal('0.12')    # High uncertainty in volatile markets
    }
    
    market_adjustment = market_adjustments[input_data.market_conditions]
    adjusted_band += market_adjustment
    
    # Adjust for property uniqueness
    uniqueness_adjustment = input_data.property_uniqueness * Decimal('0.10')
    adjusted_band += uniqueness_adjustment
    
    # Adjust for age of valuation
    if input_data.days_since_valuation > 0:
        # Add 1% per year of age, up to 15%
        age_years = Decimal(input_data.days_since_valuation) / Decimal('365')
        age_adjustment = min(age_years * Decimal('0.01'), Decimal('0.15'))
        adjusted_band += age_adjustment
    
    # Calculate estimate dispersion if multiple estimates available
    all_estimates = [input_data.estimated_market_value]
    all_estimates.extend(input_data.comparable_sales)
    all_estimates.extend([est for est, _ in input_data.other_estimates])
    
    estimate_dispersion = None
    method_consistency = Decimal('1.0')  # Default to full consistency
    
    if len(all_estimates) > 1:
        # Calculate coefficient of variation
        mean_estimate = sum(all_estimates) / len(all_estimates)
        variance = sum((est - mean_estimate) ** 2 for est in all_estimates) / len(all_estimates)
        std_dev = variance.sqrt()
        
        if mean_estimate > 0:
            cv = std_dev / mean_estimate
            estimate_dispersion = round_percentage(cv)
            
            # Adjust confidence band based on dispersion
            # Higher dispersion = wider band
            dispersion_adjustment = cv * Decimal('0.5')  # Scale factor
            adjusted_band += dispersion_adjustment
            
            # Method consistency: lower if estimates vary widely
            if cv > Decimal('0.3'):  # >30% variation
                method_consistency = Decimal('0.3')
            elif cv > Decimal('0.2'):  # >20% variation
                method_consistency = Decimal('0.6')
            elif cv > Decimal('0.1'):  # >10% variation
                method_consistency = Decimal('0.8')
    
    # Cap the confidence band at reasonable limits
    final_band = max(Decimal('0.05'), min(adjusted_band, Decimal('0.50')))  # 5% to 50%
    
    # Calculate bounds
    central_estimate = input_data.estimated_market_value
    band_amount = central_estimate * final_band
    lower_bound = central_estimate - band_amount
    upper_bound = central_estimate + band_amount
    
    # Calculate overall confidence score
    confidence_score = Decimal('1.0') - (final_band - Decimal('0.05')) / Decimal('0.45')  # Scale 5%-50% band to 1.0-0.0 score
    confidence_score = max(Decimal('0.0'), min(confidence_score, Decimal('1.0')))
    
    # Assign reliability grade
    if confidence_score >= Decimal('0.8'):
        reliability_grade = "A"
    elif confidence_score >= Decimal('0.6'):
        reliability_grade = "B" 
    elif confidence_score >= Decimal('0.4'):
        reliability_grade = "C"
    else:
        reliability_grade = "D"
    
    # Identify risk factors
    risk_factors = []
    
    if input_data.data_quality_score < Decimal('0.6'):
        risk_factors.append("Low data quality")
        
    if input_data.property_uniqueness > Decimal('0.7'):
        risk_factors.append("Highly unique property")
        
    if input_data.market_conditions in ["declining", "volatile"]:
        risk_factors.append(f"Unstable market conditions ({input_data.market_conditions})")
        
    if input_data.days_since_valuation > 365:
        risk_factors.append("Valuation more than 1 year old")
        
    if len(input_data.comparable_sales) < 3 and input_data.valuation_method == ValuationMethod.SALES_COMPARISON:
        risk_factors.append("Limited comparable sales data")
        
    if estimate_dispersion and estimate_dispersion > Decimal('0.25'):
        risk_factors.append("High dispersion between estimates")
    
    return ConfidenceResult(
        central_estimate=round_currency(central_estimate),
        confidence_band_pct=round_percentage(final_band),
        lower_bound=round_currency(lower_bound),
        upper_bound=round_currency(upper_bound),
        confidence_score=round_percentage(confidence_score),
        reliability_grade=reliability_grade,
        estimate_dispersion=estimate_dispersion,
        method_consistency=round_percentage(method_consistency),
        risk_factors=risk_factors
    )