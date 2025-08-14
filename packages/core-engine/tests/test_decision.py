"""Tests for decision engine logic."""

import pytest
from decimal import Decimal
from hypothesis import given, strategies as st

from charly_core_engine.decision import (
    make_appeal_decision, DecisionInput, DecisionResult, AppealDecision
)
from charly_core_engine.confidence import ConfidenceResult, ValuationMethod
from charly_core_engine.jurisdiction import JurisdictionPriors


def create_test_confidence_result(
    central_estimate: Decimal = Decimal('1000000'),
    confidence_band_pct: Decimal = Decimal('0.10'),
    confidence_score: Decimal = Decimal('0.8'),
    reliability_grade: str = "B"
) -> ConfidenceResult:
    """Create a test confidence result."""
    band_amount = central_estimate * confidence_band_pct
    return ConfidenceResult(
        central_estimate=central_estimate,
        confidence_band_pct=confidence_band_pct,
        lower_bound=central_estimate - band_amount,
        upper_bound=central_estimate + band_amount,
        confidence_score=confidence_score,
        reliability_grade=reliability_grade,
        method_consistency=Decimal('0.8'),
        risk_factors=[]
    )


def create_test_jurisdiction() -> JurisdictionPriors:
    """Create test jurisdiction priors."""
    return JurisdictionPriors(
        jurisdiction_id="test_county",
        jurisdiction_name="Test County",
        state="TX",
        appeal_success_rate=Decimal('0.40'),
        average_reduction_pct=Decimal('0.15'),
        typical_filing_fee=Decimal('500'),
        typical_attorney_cost=Decimal('2500')
    )


class TestDecisionInput:
    """Test DecisionInput validation."""
    
    def test_valid_input_creation(self):
        """Test creating valid decision input."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        input_data = DecisionInput(
            assessed_value=Decimal('1200000'),
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        assert input_data.assessed_value == Decimal('1200000')
        assert input_data.estimated_market_value == Decimal('1000000')
        assert input_data.tax_rate == Decimal('0.025')
        
    def test_default_values(self):
        """Test default values are applied correctly."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        input_data = DecisionInput(
            assessed_value=Decimal('1200000'),
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        assert input_data.estimated_filing_fee == Decimal('0')
        assert input_data.min_roi_threshold == Decimal('2.0')
        assert input_data.min_savings_threshold == Decimal('1000')
        assert input_data.appeal_horizon_years == 3
        
    def test_zero_assessed_value_rejected(self):
        """Test zero assessed value is rejected."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        with pytest.raises(ValueError):
            DecisionInput(
                assessed_value=Decimal('0'),
                estimated_market_value=Decimal('1000000'),
                confidence_result=confidence,
                jurisdiction_priors=jurisdiction,
                tax_rate=Decimal('0.025')
            )
            
    def test_excessive_tax_rate_rejected(self):
        """Test excessive tax rate is rejected."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        with pytest.raises(ValueError, match="unreasonably high"):
            DecisionInput(
                assessed_value=Decimal('1200000'),
                estimated_market_value=Decimal('1000000'),
                confidence_result=confidence,
                jurisdiction_priors=jurisdiction,
                tax_rate=Decimal('0.15')  # 15% tax rate
            )
            
    def test_appeal_horizon_bounds(self):
        """Test appeal horizon validation."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        # Valid range
        input_data = DecisionInput(
            assessed_value=Decimal('1200000'),
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025'),
            appeal_horizon_years=5
        )
        assert input_data.appeal_horizon_years == 5
        
        # Too low
        with pytest.raises(ValueError):
            DecisionInput(
                assessed_value=Decimal('1200000'),
                estimated_market_value=Decimal('1000000'),
                confidence_result=confidence,
                jurisdiction_priors=jurisdiction,
                tax_rate=Decimal('0.025'),
                appeal_horizon_years=0
            )
            
        # Too high
        with pytest.raises(ValueError):
            DecisionInput(
                assessed_value=Decimal('1200000'),
                estimated_market_value=Decimal('1000000'),
                confidence_result=confidence,
                jurisdiction_priors=jurisdiction,
                tax_rate=Decimal('0.025'),
                appeal_horizon_years=15
            )


class TestDecisionLogic:
    """Test core decision logic."""
    
    def test_clear_over_assessment_decision(self):
        """Test clear over-assessment scenario."""
        confidence = create_test_confidence_result(
            central_estimate=Decimal('1000000'),
            confidence_band_pct=Decimal('0.10')  # ±10%
        )
        jurisdiction = create_test_jurisdiction()
        
        # Assessed at 130% of market value - clearly outside confidence band
        input_data = DecisionInput(
            assessed_value=Decimal('1300000'),  # 30% over market
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025'),
            estimated_filing_fee=Decimal('500'),
            estimated_attorney_fee=Decimal('2000')
        )
        
        result = make_appeal_decision(input_data)
        
        assert result.decision == AppealDecision.OVER
        assert not result.within_confidence_band
        assert result.assessment_ratio == Decimal('1.30')
        assert result.expected_annual_savings > Decimal('5000')  # Should be substantial
        assert result.expected_roi > Decimal('100')  # Should be very profitable
        assert result.confidence_level in ["HIGH", "MEDIUM"]
        assert not result.reassessment_risk_warning
        
        # Should have compelling rationale
        rationale_text = " ".join(result.primary_rationale).lower()
        assert "above estimated market value" in rationale_text
        assert "confidence band" in rationale_text or "outside" in rationale_text
        
    def test_fair_assessment_decision(self):
        """Test fair assessment scenario."""
        confidence = create_test_confidence_result(
            central_estimate=Decimal('1000000'),
            confidence_band_pct=Decimal('0.10')
        )
        jurisdiction = create_test_jurisdiction()
        
        # Assessed within confidence band
        input_data = DecisionInput(
            assessed_value=Decimal('1050000'),  # 5% over market, within 10% band
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        result = make_appeal_decision(input_data)
        
        assert result.decision == AppealDecision.FAIR
        assert result.within_confidence_band
        assert result.assessment_ratio == Decimal('1.05')
        assert not result.reassessment_risk_warning
        
        # Should explain why fair
        rationale_text = " ".join(result.primary_rationale).lower()
        assert "within reasonable bounds" in rationale_text or "reasonable" in rationale_text
        
    def test_under_assessment_decision(self):
        """Test under-assessment scenario."""
        confidence = create_test_confidence_result(
            central_estimate=Decimal('1000000'),
            confidence_band_pct=Decimal('0.10')
        )
        jurisdiction = create_test_jurisdiction()
        
        # Assessed significantly below market value
        input_data = DecisionInput(
            assessed_value=Decimal('800000'),  # 20% below market
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        result = make_appeal_decision(input_data)
        
        assert result.decision == AppealDecision.UNDER
        assert result.assessment_ratio == Decimal('0.80')
        assert result.reassessment_risk_warning is True
        assert result.expected_annual_savings < 0  # Would increase taxes
        
        # Should warn about reassessment risk
        rationale_text = " ".join(result.primary_rationale).lower()
        assert "below" in rationale_text
        assert "higher assessment" in rationale_text or "increase" in rationale_text
        
        risk_text = " ".join(result.risk_factors).lower()
        assert "reassessment" in risk_text or "increase" in risk_text
        
    def test_over_assessment_but_uneconomical(self):
        """Test over-assessment that's not economical to appeal."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        # Small over-assessment with high costs
        input_data = DecisionInput(
            assessed_value=Decimal('1020000'),  # Only 2% over
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.01'),  # Low tax rate
            estimated_filing_fee=Decimal('1000'),
            estimated_attorney_fee=Decimal('5000'),  # High costs
            min_roi_threshold=Decimal('3.0')  # High ROI threshold
        )
        
        result = make_appeal_decision(input_data)
        
        # Might still be classified as OVER due to being above market, 
        # but should have warnings about economics
        if result.decision == AppealDecision.OVER:
            risk_text = " ".join(result.risk_factors).lower()
            assert "costs" in risk_text or "roi" in risk_text or "savings" in risk_text
            assert result.expected_roi < Decimal('3.0')
        else:
            # Or classified as FAIR due to economics
            assert result.decision == AppealDecision.FAIR
            
    def test_success_probability_adjustment(self):
        """Test success probability is adjusted based on assessment ratio."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()  # 40% base success rate
        
        # Scenario 1: Clearly over-assessed - should increase success probability
        over_input = DecisionInput(
            assessed_value=Decimal('1400000'),  # 40% over
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        over_result = make_appeal_decision(over_input)
        
        # Scenario 2: Slightly over-assessed - lower success probability
        slight_input = DecisionInput(
            assessed_value=Decimal('1100000'),  # 10% over
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        slight_result = make_appeal_decision(slight_input)
        
        # Clear over-assessment should have higher success probability
        assert over_result.success_probability > slight_result.success_probability
        
    def test_confidence_level_assignment(self):
        """Test confidence level assignment logic."""
        jurisdiction = create_test_jurisdiction()
        
        # High confidence scenario
        high_confidence = create_test_confidence_result(
            confidence_score=Decimal('0.9'),
            reliability_grade="A"
        )
        
        high_input = DecisionInput(
            assessed_value=Decimal('1300000'),  # Clear over-assessment
            estimated_market_value=Decimal('1000000'),
            confidence_result=high_confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        high_result = make_appeal_decision(high_input)
        
        # Low confidence scenario  
        low_confidence = create_test_confidence_result(
            confidence_score=Decimal('0.3'),
            reliability_grade="D"
        )
        
        low_input = DecisionInput(
            assessed_value=Decimal('1050000'),  # Marginal over-assessment
            estimated_market_value=Decimal('1000000'),
            confidence_result=low_confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        low_result = make_appeal_decision(low_input)
        
        # High confidence clear case should have higher confidence level
        confidence_order = ["LOW", "MEDIUM", "HIGH"]
        high_idx = confidence_order.index(high_result.confidence_level)
        low_idx = confidence_order.index(low_result.confidence_level)
        
        assert high_idx >= low_idx  # High should be same or higher confidence
        
    def test_jurisdiction_defaults_used(self):
        """Test jurisdiction defaults are used when no costs provided."""
        confidence = create_test_confidence_result()
        jurisdiction = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            typical_filing_fee=Decimal('750'),
            typical_attorney_cost=Decimal('3500')
        )
        
        input_data = DecisionInput(
            assessed_value=Decimal('1200000'),
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
            # No costs provided
        )
        
        result = make_appeal_decision(input_data)
        
        # Should use jurisdiction defaults
        expected_costs = Decimal('750') + Decimal('3500')  # 4250
        assert result.total_appeal_costs == expected_costs
        
    def test_roi_calculation(self):
        """Test ROI calculation accuracy."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        input_data = DecisionInput(
            assessed_value=Decimal('1200000'),
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025'),
            estimated_filing_fee=Decimal('500'),
            estimated_attorney_fee=Decimal('2000'),
            appeal_horizon_years=4
        )
        
        result = make_appeal_decision(input_data)
        
        # Manual ROI calculation for verification
        # Assessed: 1,200,000, Estimated: 1,000,000
        # Jurisdiction reduces by 15% on average: 1,200,000 * 0.15 = 180,000
        # But don't reduce below market: max(1,020,000, 1,000,000) = 1,020,000
        # Actually: reduced_assessment = 1,200,000 * (1 - 0.15) = 1,020,000
        # Annual savings: (1,200,000 - 1,020,000) * 0.025 = 4,500
        # Total costs: 2,500
        # 4-year benefits: 4,500 * 4 = 18,000
        # ROI: ((18,000 - 2,500) / 2,500) * 100 = 620%
        
        assert result.expected_annual_savings == Decimal('4500.00')
        assert result.total_appeal_costs == Decimal('2500.00')
        assert result.expected_roi == Decimal('620.00')
        
    def test_breakeven_calculation(self):
        """Test breakeven reduction percentage calculation."""
        confidence = create_test_confidence_result()
        jurisdiction = create_test_jurisdiction()
        
        input_data = DecisionInput(
            assessed_value=Decimal('1000000'),
            estimated_market_value=Decimal('900000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.020'),  # 2%
            estimated_filing_fee=Decimal('600'),
            estimated_attorney_fee=Decimal('1800'),  # Total costs: 2400
            appeal_horizon_years=3
        )
        
        result = make_appeal_decision(input_data)
        
        # Manual breakeven calculation:
        # Total costs: 2400
        # Annual savings needed: 2400 / 3 = 800
        # Reduction needed: 800 / 0.02 = 40,000
        # Percentage: 40,000 / 1,000,000 = 4%
        
        assert result.breakeven_reduction_pct == Decimal('4.00')
        
    def test_risk_factors_identification(self):
        """Test various risk factors are identified."""
        low_confidence = create_test_confidence_result(
            confidence_score=Decimal('0.3'),
            reliability_grade="D"
        )
        
        low_success_jurisdiction = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            appeal_success_rate=Decimal('0.25')  # Low success rate
        )
        
        input_data = DecisionInput(
            assessed_value=Decimal('1100000'),
            estimated_market_value=Decimal('1000000'),
            confidence_result=low_confidence,
            jurisdiction_priors=low_success_jurisdiction,
            tax_rate=Decimal('0.025'),
            min_savings_threshold=Decimal('3000'),  # High threshold
            min_roi_threshold=Decimal('5.0')  # High ROI threshold
        )
        
        result = make_appeal_decision(input_data)
        
        risk_text = " ".join(result.risk_factors).lower()
        
        # Should identify multiple risk factors
        potential_risks = [
            "reliability grade",
            "probability of success", 
            "roi",
            "threshold"
        ]
        
        identified_risks = sum(1 for risk in potential_risks if risk in risk_text)
        assert identified_risks >= 2, f"Should identify multiple risks, found: {result.risk_factors}"
        
    def test_supporting_factors_identification(self):
        """Test supporting factors are identified for strong cases."""
        high_confidence = create_test_confidence_result(
            confidence_score=Decimal('0.9'),
            reliability_grade="A"
        )
        
        high_success_jurisdiction = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            appeal_success_rate=Decimal('0.70')  # High success rate
        )
        
        input_data = DecisionInput(
            assessed_value=Decimal('1300000'),  # Clear over-assessment
            estimated_market_value=Decimal('1000000'),
            confidence_result=high_confidence,
            jurisdiction_priors=high_success_jurisdiction,
            tax_rate=Decimal('0.025'),
            estimated_filing_fee=Decimal('300'),
            estimated_attorney_fee=Decimal('1500')  # Low costs
        )
        
        result = make_appeal_decision(input_data)
        
        assert result.decision == AppealDecision.OVER
        
        supporting_text = " ".join(result.supporting_factors).lower()
        
        # Should identify positive factors
        potential_support = [
            "probability of success",
            "high-quality valuation",
            "grade a"
        ]
        
        identified_support = sum(1 for support in potential_support if support in supporting_text)
        assert identified_support >= 1, f"Should identify supporting factors, found: {result.supporting_factors}"
        
    @given(
        assessed_value=st.decimals(min_value=500000, max_value=2000000, places=2),
        market_value=st.decimals(min_value=500000, max_value=2000000, places=2),
        tax_rate=st.decimals(min_value=0.001, max_value=0.05, places=4)
    )
    def test_property_based_decision(self, assessed_value, market_value, tax_rate):
        """Property-based test for decision making."""
        confidence = create_test_confidence_result(
            central_estimate=market_value,
            confidence_band_pct=Decimal('0.10')
        )
        jurisdiction = create_test_jurisdiction()
        
        input_data = DecisionInput(
            assessed_value=assessed_value,
            estimated_market_value=market_value,
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=tax_rate
        )
        
        result = make_appeal_decision(input_data)
        
        # Basic invariants
        assert result.decision in [AppealDecision.OVER, AppealDecision.FAIR, AppealDecision.UNDER]
        assert result.confidence_level in ["LOW", "MEDIUM", "HIGH"]
        assert result.assessment_ratio > 0
        assert Decimal('0.0') <= result.success_probability <= Decimal('1.0')
        assert len(result.primary_rationale) >= 1
        
        # Decision consistency checks
        ratio = assessed_value / market_value
        
        if ratio < Decimal('0.90'):
            # Should be UNDER with reassessment warning
            assert result.decision == AppealDecision.UNDER
            assert result.reassessment_risk_warning is True
        elif ratio > Decimal('1.20'):
            # Clear over-assessment should be OVER (unless very uneconomical)
            assert result.decision in [AppealDecision.OVER, AppealDecision.FAIR]


class TestDecisionResult:
    """Test DecisionResult model."""
    
    def test_json_serialization(self):
        """Test decision result can be serialized to JSON."""
        result = DecisionResult(
            decision=AppealDecision.OVER,
            confidence_level="HIGH",
            assessment_ratio=Decimal('1.20'),
            expected_annual_savings=Decimal('5000.00'),
            expected_roi=Decimal('250.00'),
            breakeven_reduction_pct=Decimal('2.50'),
            primary_rationale=["Assessment is 20% above market value"],
            risk_factors=[],
            supporting_factors=["High probability of success"],
            within_confidence_band=False,
            success_probability=Decimal('0.65'),
            reassessment_risk_warning=False,
            total_appeal_costs=Decimal('3000.00'),
            net_savings_year_1=Decimal('2000.00'),
            cumulative_net_savings=Decimal('12000.00')
        )
        
        # Should serialize without errors
        json_data = result.dict()
        
        # Enums should be serialized as strings
        assert json_data['decision'] == "OVER"
        
        # Decimals should be preserved
        assert isinstance(json_data['assessment_ratio'], Decimal)