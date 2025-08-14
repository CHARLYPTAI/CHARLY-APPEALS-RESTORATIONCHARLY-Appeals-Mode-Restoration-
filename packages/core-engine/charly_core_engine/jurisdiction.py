"""Jurisdiction-specific priors and statistics for decision making."""

from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class JurisdictionPriors(BaseModel):
    """Historical statistics and priors for a jurisdiction."""
    
    jurisdiction_id: str = Field(..., description="Unique jurisdiction identifier")
    jurisdiction_name: str = Field(..., description="Human-readable jurisdiction name")
    state: str = Field(..., min_length=2, max_length=2, description="Two-letter state code")
    
    # Success rate statistics
    appeal_success_rate: Decimal = Field(0.35, ge=0, le=1, description="Historical appeal success rate")
    average_reduction_pct: Decimal = Field(0.15, ge=0, le=1, description="Average assessment reduction when successful")
    median_reduction_pct: Decimal = Field(0.12, ge=0, le=1, description="Median assessment reduction when successful")
    
    # Cost and timing
    typical_filing_fee: Decimal = Field(0, ge=0, description="Typical filing fee")
    typical_attorney_cost: Decimal = Field(2500, ge=0, description="Typical attorney cost")
    average_timeline_days: int = Field(180, ge=30, le=730, description="Average appeal timeline in days")
    
    # Assessment patterns
    cod_target: Decimal = Field(0.10, gt=0, le=0.50, description="Coefficient of Dispersion target")
    reassessment_risk_factor: Decimal = Field(0.05, ge=0, le=1, description="Risk of reassessment increase")
    
    # Jurisdiction characteristics
    uses_market_value: bool = Field(True, description="True if jurisdiction uses market value")
    assessment_ratio: Decimal = Field(1.0, gt=0, le=1, description="Assessment ratio (assessed/market)")
    last_revaluation_year: Optional[int] = Field(None, description="Last county-wide revaluation year")
    
    @validator("state")
    def validate_state_code(cls, v):
        if not v.isupper():
            v = v.upper()
        # Basic validation - could be enhanced with full state list
        if len(v) != 2 or not v.isalpha():
            raise ValueError("State must be two-letter code (e.g., 'TX', 'CA')")
        return v
        
    @validator("*", pre=True)
    def convert_to_decimal(cls, v):
        if isinstance(v, (int, float, str)) and any(field in cls.__annotations__ for field in ['appeal_success_rate', 'average_reduction_pct', 'median_reduction_pct', 'typical_filing_fee', 'typical_attorney_cost', 'cod_target', 'reassessment_risk_factor', 'assessment_ratio']):
            return Decimal(str(v))
        return v
    
    @classmethod
    def get_default_priors(cls, state: str = "TX") -> "JurisdictionPriors":
        """Get conservative default priors when jurisdiction-specific data unavailable."""
        return cls(
            jurisdiction_id=f"default_{state.lower()}",
            jurisdiction_name=f"Default {state.upper()} Jurisdiction",
            state=state,
            appeal_success_rate=Decimal('0.30'),  # Conservative estimate
            average_reduction_pct=Decimal('0.12'),
            median_reduction_pct=Decimal('0.10'),
            typical_filing_fee=Decimal('500'),
            typical_attorney_cost=Decimal('3000'),
            average_timeline_days=180,
            cod_target=Decimal('0.10'),  # Standard COD target
            reassessment_risk_factor=Decimal('0.05'),
            uses_market_value=True,
            assessment_ratio=Decimal('1.0'),
            last_revaluation_year=None
        )