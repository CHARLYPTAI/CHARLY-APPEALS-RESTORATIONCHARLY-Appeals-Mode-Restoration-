"""Core decision engine for property tax appeal classification."""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum

from .confidence import ConfidenceResult
from .jurisdiction import JurisdictionPriors


class AppealDecision(str, Enum):
    """Possible appeal decisions."""
    OVER = "OVER"      # Over-assessed - appeal recommended
    FAIR = "FAIR"      # Fairly assessed - appeal not recommended  
    UNDER = "UNDER"    # Under-assessed - warn about reassessment risk


class DecisionInput(BaseModel):
    """Input data for appeal decision."""
    
    # Property valuation
    assessed_value: Decimal = Field(..., gt=0, description="Current assessed value")
    estimated_market_value: Decimal = Field(..., gt=0, description="Estimated market value")
    confidence_result: ConfidenceResult = Field(..., description="Confidence band analysis")
    
    # Jurisdiction context
    jurisdiction_priors: JurisdictionPriors = Field(..., description="Jurisdiction-specific statistics")
    tax_rate: Decimal = Field(..., gt=0, description="Effective tax rate (decimal)")
    
    # Appeal costs and context
    estimated_filing_fee: Decimal = Field(0, ge=0, description="Estimated filing fee")
    estimated_attorney_fee: Decimal = Field(0, ge=0, description="Estimated attorney fee")
    estimated_other_costs: Decimal = Field(0, ge=0, description="Other estimated costs")
    
    # Decision parameters
    min_roi_threshold: Decimal = Field(Decimal('2.0'), gt=0, description="Minimum ROI threshold for recommendation")
    min_savings_threshold: Decimal = Field(Decimal('1000'), ge=0, description="Minimum annual savings threshold")
    appeal_horizon_years: int = Field(3, ge=1, le=10, description="Years to consider for savings calculation")
    
    @validator("tax_rate")
    def validate_tax_rate(cls, v):
        if v > Decimal('0.10'):  # 10% seems very high
            raise ValueError("Tax rate seems unreasonably high (>10%)")
        return v
        
    @validator("*", pre=True)
    def convert_to_decimal(cls, v):
        if isinstance(v, (int, float, str)) and any(field in cls.__annotations__ for field in ['assessed_value', 'estimated_market_value', 'tax_rate', 'estimated_filing_fee', 'estimated_attorney_fee', 'estimated_other_costs', 'min_roi_threshold', 'min_savings_threshold']):
            return Decimal(str(v))
        return v


class DecisionResult(BaseModel):
    """Result of appeal decision analysis."""
    
    decision: AppealDecision = Field(..., description="Primary appeal decision")
    confidence_level: str = Field(..., description="HIGH/MEDIUM/LOW confidence")
    
    # Key metrics
    assessment_ratio: Decimal = Field(..., description="Assessed / Market ratio")
    expected_annual_savings: Decimal = Field(..., description="Expected annual tax savings if successful")
    expected_roi: Optional[Decimal] = Field(None, description="Expected ROI percentage if successful")
    breakeven_reduction_pct: Decimal = Field(..., description="Reduction % needed to break even")
    
    # Rationale and reasoning
    primary_rationale: List[str] = Field(..., description="Primary reasons for decision")
    risk_factors: List[str] = Field(..., description="Risk factors to consider")
    supporting_factors: List[str] = Field(..., description="Factors supporting the decision")
    
    # Detailed analysis
    within_confidence_band: bool = Field(..., description="Assessment within confidence band")
    success_probability: Decimal = Field(..., description="Estimated probability of successful appeal")
    reassessment_risk_warning: bool = Field(False, description="Warning about reassessment risk")
    
    # Financial projections
    total_appeal_costs: Decimal = Field(..., description="Total estimated appeal costs")
    net_savings_year_1: Decimal = Field(..., description="Net savings in first year")
    cumulative_net_savings: Decimal = Field(..., description="Cumulative net savings over horizon")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }


def make_appeal_decision(input_data: DecisionInput) -> DecisionResult:
    """
    Make Over/Fair/Under decision for property tax appeal.
    
    Decision Logic:
    - OVER: Assessment significantly above market value AND expected ROI > threshold
    - FAIR: Assessment within reasonable bounds of market value
    - UNDER: Assessment below market value (warn about reassessment risk)
    
    Args:
        input_data: Decision analysis inputs
        
    Returns:
        DecisionResult with recommendation and detailed analysis
    """
    
    def round_currency(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def round_percentage(value: Decimal) -> Decimal:
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Calculate assessment ratio
    assessment_ratio = input_data.assessed_value / input_data.estimated_market_value
    
    # Check if assessment is within confidence band
    within_confidence_band = (
        input_data.confidence_result.lower_bound <= input_data.assessed_value <= 
        input_data.confidence_result.upper_bound
    )
    
    # Calculate potential savings if appeal successful
    # Use jurisdiction's typical reduction for estimation
    typical_reduction = input_data.jurisdiction_priors.average_reduction_pct
    reduced_assessment = input_data.assessed_value * (Decimal('1.0') - typical_reduction)
    
    # Don't reduce below market value estimate
    reduced_assessment = max(reduced_assessment, input_data.estimated_market_value)
    
    annual_tax_savings = (input_data.assessed_value - reduced_assessment) * input_data.tax_rate
    
    # Calculate costs and ROI
    total_costs = (
        input_data.estimated_filing_fee + 
        input_data.estimated_attorney_fee + 
        input_data.estimated_other_costs
    )
    
    # If no costs provided, use jurisdiction defaults
    if total_costs == 0:
        total_costs = (
            input_data.jurisdiction_priors.typical_filing_fee +
            input_data.jurisdiction_priors.typical_attorney_cost
        )
    
    net_first_year = annual_tax_savings - total_costs
    cumulative_savings = (annual_tax_savings * input_data.appeal_horizon_years) - total_costs
    
    # Calculate ROI if there are costs
    expected_roi = None
    if total_costs > 0:
        total_benefits = annual_tax_savings * input_data.appeal_horizon_years
        roi = ((total_benefits - total_costs) / total_costs) * 100
        expected_roi = round_percentage(roi)
    
    # Calculate breakeven reduction percentage
    if total_costs > 0 and input_data.tax_rate > 0:
        breakeven_annual_savings = total_costs / input_data.appeal_horizon_years
        breakeven_reduction_amount = breakeven_annual_savings / input_data.tax_rate
        breakeven_reduction_pct = breakeven_reduction_amount / input_data.assessed_value
        breakeven_reduction_pct = round_percentage(breakeven_reduction_pct)
    else:
        breakeven_reduction_pct = Decimal('0.00')
    
    # Initialize decision factors
    primary_rationale = []
    risk_factors = []
    supporting_factors = []
    reassessment_risk_warning = False
    
    # Success probability starts with jurisdiction baseline
    success_probability = input_data.jurisdiction_priors.appeal_success_rate
    
    # Adjust success probability based on how far outside confidence band
    if not within_confidence_band:
        if assessment_ratio > Decimal('1.0'):
            # Over-assessed: increase success probability
            excess_ratio = assessment_ratio - Decimal('1.0')
            confidence_band_size = input_data.confidence_result.confidence_band_pct
            
            # The further outside the band, the higher the success probability
            if excess_ratio > confidence_band_size:
                adjustment = min(excess_ratio * Decimal('0.5'), Decimal('0.3'))  # Cap at 30% boost
                success_probability = min(success_probability + adjustment, Decimal('0.9'))
        else:
            # Under-assessed: decrease success probability (would likely increase assessment)
            success_probability = min(success_probability * Decimal('0.3'), Decimal('0.2'))
    
    # Adjust for confidence in valuation
    confidence_adjustment = (input_data.confidence_result.confidence_score - Decimal('0.5')) * Decimal('0.2')
    success_probability = max(Decimal('0.05'), min(success_probability + confidence_adjustment, Decimal('0.95')))
    
    # PRIMARY DECISION LOGIC
    
    if assessment_ratio < Decimal('0.90'):
        # Significantly under-assessed - warn about reassessment risk
        decision = AppealDecision.UNDER
        reassessment_risk_warning = True
        
        primary_rationale.append(f"Assessment is {round_percentage((Decimal('1.0') - assessment_ratio) * 100)}% below estimated market value")
        primary_rationale.append("Appealing could result in a higher assessment")
        
        risk_factors.append("High risk of assessment increase upon review")
        risk_factors.append("May trigger county-wide reassessment attention")
        
        if input_data.jurisdiction_priors.reassessment_risk_factor > Decimal('0.1'):
            risk_factors.append("Jurisdiction has history of reassessment increases")
            
    elif (assessment_ratio <= (Decimal('1.0') + input_data.jurisdiction_priors.cod_target) and
          within_confidence_band):
        # Within reasonable bounds - fair assessment
        decision = AppealDecision.FAIR
        
        primary_rationale.append("Assessment is within reasonable bounds of market value")
        primary_rationale.append(f"Assessment ratio of {round_percentage(assessment_ratio * 100)}% is reasonable")
        
        if within_confidence_band:
            primary_rationale.append("Assessment falls within valuation confidence band")
        
        # Check if appeal still might be worthwhile despite fair assessment
        if (expected_roi and expected_roi > input_data.min_roi_threshold and 
            annual_tax_savings > input_data.min_savings_threshold):
            supporting_factors.append(f"Appeal could still provide {expected_roi}% ROI")
        else:
            risk_factors.append("Expected savings may not justify appeal costs")
            
    else:
        # Potentially over-assessed - check economics
        decision = AppealDecision.OVER
        
        excess_pct = round_percentage((assessment_ratio - Decimal('1.0')) * 100)
        primary_rationale.append(f"Assessment appears {excess_pct}% above estimated market value")
        
        if not within_confidence_band:
            band_pct = round_percentage(input_data.confidence_result.confidence_band_pct * 100)
            primary_rationale.append(f"Assessment is outside {band_pct}% confidence band")
            
        # Economic analysis
        if expected_roi and expected_roi > input_data.min_roi_threshold:
            primary_rationale.append(f"Expected ROI of {expected_roi}% exceeds {input_data.min_roi_threshold}% threshold")
        else:
            # Even if over-assessed, might not be economical
            if expected_roi:
                risk_factors.append(f"Expected ROI of {expected_roi}% is below {input_data.min_roi_threshold}% threshold")
            else:
                risk_factors.append("Appeal costs may exceed potential savings")
                
        if annual_tax_savings > input_data.min_savings_threshold:
            supporting_factors.append(f"Expected annual savings of ${annual_tax_savings} exceeds threshold")
        else:
            risk_factors.append(f"Expected annual savings below ${input_data.min_savings_threshold} threshold")
    
    # Determine confidence level
    confidence_factors = 0
    
    # High confidence factors
    if input_data.confidence_result.confidence_score > Decimal('0.7'):
        confidence_factors += 2
    elif input_data.confidence_result.confidence_score > Decimal('0.5'):
        confidence_factors += 1
        
    if assessment_ratio > Decimal('1.15') or assessment_ratio < Decimal('0.85'):
        confidence_factors += 2  # Clear over/under assessment
    elif assessment_ratio > Decimal('1.10') or assessment_ratio < Decimal('0.90'):
        confidence_factors += 1  # Moderate over/under
        
    if success_probability > Decimal('0.6'):
        confidence_factors += 1
    
    if len(input_data.confidence_result.risk_factors) <= 2:
        confidence_factors += 1
        
    # Assign confidence level
    if confidence_factors >= 5:
        confidence_level = "HIGH"
    elif confidence_factors >= 3:
        confidence_level = "MEDIUM" 
    else:
        confidence_level = "LOW"
    
    # Add general risk factors
    if input_data.confidence_result.reliability_grade in ["C", "D"]:
        risk_factors.append(f"Valuation reliability grade: {input_data.confidence_result.reliability_grade}")
        
    if success_probability < Decimal('0.4'):
        risk_factors.append("Below-average probability of success in this jurisdiction")
        
    # Add supporting factors for strong cases
    if decision == AppealDecision.OVER:
        if success_probability > Decimal('0.6'):
            supporting_factors.append("Above-average probability of success")
            
        if input_data.confidence_result.reliability_grade in ["A", "B"]:
            supporting_factors.append(f"High-quality valuation (Grade {input_data.confidence_result.reliability_grade})")
    
    return DecisionResult(
        decision=decision,
        confidence_level=confidence_level,
        assessment_ratio=round_percentage(assessment_ratio),
        expected_annual_savings=round_currency(annual_tax_savings),
        expected_roi=expected_roi,
        breakeven_reduction_pct=breakeven_reduction_pct,
        primary_rationale=primary_rationale,
        risk_factors=risk_factors,
        supporting_factors=supporting_factors,
        within_confidence_band=within_confidence_band,
        success_probability=round_percentage(success_probability),
        reassessment_risk_warning=reassessment_risk_warning,
        total_appeal_costs=round_currency(total_costs),
        net_savings_year_1=round_currency(net_first_year),
        cumulative_net_savings=round_currency(cumulative_savings)
    )