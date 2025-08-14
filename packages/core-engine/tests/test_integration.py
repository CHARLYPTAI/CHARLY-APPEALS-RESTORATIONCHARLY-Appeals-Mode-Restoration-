"""Integration tests for core engine package."""

import pytest
from decimal import Decimal

from charly_core_engine import (
    make_appeal_decision, DecisionInput, DecisionResult,
    calculate_confidence_band, ConfidenceInput, ConfidenceResult,
    JurisdictionPriors
)
from charly_core_engine.confidence import ValuationMethod
from charly_core_engine.decision import AppealDecision


class TestCoreEngineIntegration:
    """Test integration between confidence calculation and decision making."""
    
    def test_full_decision_workflow(self):
        """Test complete workflow: confidence calculation → decision analysis."""
        
        # Step 1: Calculate confidence band for property valuation
        confidence_input = ConfidenceInput(
            estimated_market_value=Decimal('950000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            comparable_sales=[
                Decimal('920000'),
                Decimal('980000'),
                Decimal('940000')
            ],
            other_estimates=[
                (Decimal('960000'), ValuationMethod.COST_APPROACH)
            ],
            data_quality_score=Decimal('0.85'),
            market_conditions="stable",
            property_uniqueness=Decimal('0.3'),  # Relatively common property
            days_since_valuation=45
        )
        
        confidence_result = calculate_confidence_band(confidence_input)
        
        # Should have reasonable confidence for good comp data
        assert confidence_result.confidence_score >= Decimal('0.6')
        assert confidence_result.reliability_grade in ["A", "B", "C"]
        assert confidence_result.estimate_dispersion <= Decimal('0.10')  # Low dispersion
        
        # Step 2: Set up jurisdiction context
        jurisdiction = JurisdictionPriors(
            jurisdiction_id="collin_county_tx",
            jurisdiction_name="Collin County, TX",
            state="TX",
            appeal_success_rate=Decimal('0.45'),
            average_reduction_pct=Decimal('0.18'),
            typical_filing_fee=Decimal('450'),
            typical_attorney_cost=Decimal('2800'),
            average_timeline_days=165,
            cod_target=Decimal('0.09'),
            uses_market_value=True
        )
        
        # Step 3: Test OVER scenario - property over-assessed
        over_decision_input = DecisionInput(
            assessed_value=Decimal('1150000'),  # ~21% over market estimate
            estimated_market_value=confidence_result.central_estimate,
            confidence_result=confidence_result,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.0285'),  # Typical Texas rate
            estimated_filing_fee=Decimal('450'),
            estimated_attorney_fee=Decimal('3200'),
            appeal_horizon_years=4
        )
        
        over_decision = make_appeal_decision(over_decision_input)
        
        # Should recommend appeal
        assert over_decision.decision == AppealDecision.OVER
        assert not over_decision.within_confidence_band
        assert over_decision.assessment_ratio > Decimal('1.15')
        assert over_decision.expected_annual_savings > Decimal('3000')
        assert over_decision.expected_roi > Decimal('100')  # Should be profitable
        assert over_decision.confidence_level in ["MEDIUM", "HIGH"]
        
        # Should have compelling rationale
        rationale_text = " ".join(over_decision.primary_rationale).lower()
        assert "above" in rationale_text and ("market" in rationale_text or "value" in rationale_text)
        
        # Step 4: Test FAIR scenario - same property fairly assessed
        fair_decision_input = DecisionInput(
            assessed_value=Decimal('975000'),  # ~3% over market, within confidence band
            estimated_market_value=confidence_result.central_estimate,
            confidence_result=confidence_result,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.0285')
        )
        
        fair_decision = make_appeal_decision(fair_decision_input)
        
        # Should not recommend appeal
        assert fair_decision.decision == AppealDecision.FAIR
        assert fair_decision.within_confidence_band
        assert fair_decision.assessment_ratio <= Decimal('1.10')
        
        # Step 5: Test UNDER scenario - property under-assessed
        under_decision_input = DecisionInput(
            assessed_value=Decimal('800000'),  # ~16% below market
            estimated_market_value=confidence_result.central_estimate,
            confidence_result=confidence_result,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.0285')
        )
        
        under_decision = make_appeal_decision(under_decision_input)
        
        # Should warn against appeal
        assert under_decision.decision == AppealDecision.UNDER
        assert under_decision.reassessment_risk_warning is True
        assert under_decision.expected_annual_savings < 0
        assert under_decision.assessment_ratio < Decimal('0.90')
        
    def test_low_confidence_impact_on_decision(self):
        """Test how low confidence valuation affects decision making."""
        
        # Low confidence valuation
        low_confidence_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.AUTOMATED_VALUATION,  # Less reliable
            data_quality_score=Decimal('0.4'),  # Poor data quality
            market_conditions="volatile",       # Unstable market
            property_uniqueness=Decimal('0.8'), # Unique property
            days_since_valuation=550            # Old valuation
        )
        
        low_confidence_result = calculate_confidence_band(low_confidence_input)
        
        # Should have wide confidence band and low score
        assert low_confidence_result.confidence_band_pct >= Decimal('0.25')
        assert low_confidence_result.confidence_score <= Decimal('0.5')
        assert low_confidence_result.reliability_grade in ["C", "D"]
        assert len(low_confidence_result.risk_factors) >= 3
        
        # Even clear over-assessment should have lower confidence
        jurisdiction = JurisdictionPriors.get_default_priors("TX")
        
        decision_input = DecisionInput(
            assessed_value=Decimal('1300000'),  # 30% over
            estimated_market_value=low_confidence_result.central_estimate,
            confidence_result=low_confidence_result,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        decision = make_appeal_decision(decision_input)
        
        # Should still be OVER but with lower confidence
        assert decision.decision == AppealDecision.OVER
        assert decision.confidence_level in ["LOW", "MEDIUM"]  # Not HIGH due to valuation uncertainty
        
        # Should mention valuation reliability in risk factors
        risk_text = " ".join(decision.risk_factors).lower()
        assert "reliability" in risk_text or "grade" in risk_text
        
    def test_jurisdiction_variation_impact(self):
        """Test how different jurisdictions affect decisions."""
        
        # Standard confidence result
        confidence = ConfidenceResult(
            central_estimate=Decimal('1000000.00'),
            confidence_band_pct=Decimal('0.120'),
            lower_bound=Decimal('880000.00'),
            upper_bound=Decimal('1120000.00'),
            confidence_score=Decimal('0.750'),
            reliability_grade="B",
            method_consistency=Decimal('0.800'),
            risk_factors=[]
        )
        
        # High-success jurisdiction (plaintiff-friendly)
        favorable_jurisdiction = JurisdictionPriors(
            jurisdiction_id="favorable_county",
            jurisdiction_name="Favorable County",
            state="TX",
            appeal_success_rate=Decimal('0.65'),    # High success rate
            average_reduction_pct=Decimal('0.22'),  # Large reductions
            typical_filing_fee=Decimal('300'),      # Low filing fee
            typical_attorney_cost=Decimal('1800'),  # Low attorney cost
            cod_target=Decimal('0.15'),             # Generous COD target
            reassessment_risk_factor=Decimal('0.02') # Low reassessment risk
        )
        
        # Low-success jurisdiction (government-friendly)
        tough_jurisdiction = JurisdictionPriors(
            jurisdiction_id="tough_county",
            jurisdiction_name="Tough County",
            state="CA",
            appeal_success_rate=Decimal('0.20'),    # Low success rate
            average_reduction_pct=Decimal('0.08'),  # Small reductions
            typical_filing_fee=Decimal('800'),      # High filing fee
            typical_attorney_cost=Decimal('4500'),  # High attorney cost
            cod_target=Decimal('0.05'),             # Strict COD target
            reassessment_risk_factor=Decimal('0.12') # High reassessment risk
        )
        
        # Same property assessment in both jurisdictions
        base_input = {
            "assessed_value": Decimal('1180000'),  # 18% over
            "estimated_market_value": Decimal('1000000'),
            "confidence_result": confidence,
            "tax_rate": Decimal('0.024')
        }
        
        favorable_input = DecisionInput(**base_input, jurisdiction_priors=favorable_jurisdiction)
        tough_input = DecisionInput(**base_input, jurisdiction_priors=tough_jurisdiction)
        
        favorable_decision = make_appeal_decision(favorable_input)
        tough_decision = make_appeal_decision(tough_input)
        
        # Both should be OVER, but favorable should be more confident
        assert favorable_decision.decision == AppealDecision.OVER
        assert tough_decision.decision == AppealDecision.OVER
        
        # Favorable jurisdiction should have better metrics
        assert favorable_decision.success_probability > tough_decision.success_probability
        assert favorable_decision.expected_roi > tough_decision.expected_roi
        assert favorable_decision.total_appeal_costs < tough_decision.total_appeal_costs
        
        # Confidence levels may differ
        confidence_order = ["LOW", "MEDIUM", "HIGH"]
        fav_idx = confidence_order.index(favorable_decision.confidence_level)
        tough_idx = confidence_order.index(tough_decision.confidence_level)
        assert fav_idx >= tough_idx  # Favorable should be same or higher confidence
        
    def test_edge_case_exactly_at_confidence_bounds(self):
        """Test decisions when assessment is exactly at confidence band boundaries."""
        
        confidence = ConfidenceResult(
            central_estimate=Decimal('1000000.00'),
            confidence_band_pct=Decimal('0.100'),  # Exactly ±10%
            lower_bound=Decimal('900000.00'),
            upper_bound=Decimal('1100000.00'),
            confidence_score=Decimal('0.800'),
            reliability_grade="B",
            method_consistency=Decimal('0.800'),
            risk_factors=[]
        )
        
        jurisdiction = JurisdictionPriors.get_default_priors("TX")
        
        # Test assessment exactly at upper bound
        upper_bound_input = DecisionInput(
            assessed_value=Decimal('1100000'),  # Exactly at upper bound
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        upper_decision = make_appeal_decision(upper_bound_input)
        
        # At the boundary - could be FAIR or OVER depending on other factors
        assert upper_decision.within_confidence_band is True
        
        # Test assessment exactly at lower bound
        lower_bound_input = DecisionInput(
            assessed_value=Decimal('900000'),  # Exactly at lower bound
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025')
        )
        
        lower_decision = make_appeal_decision(lower_bound_input)
        
        assert lower_decision.within_confidence_band is True
        # At 10% below market, might be UNDER or FAIR depending on jurisdiction COD target
        
    def test_zero_cost_appeal_scenario(self):
        """Test decision when appeal costs are zero (pro bono or self-represented)."""
        
        confidence = ConfidenceResult(
            central_estimate=Decimal('1000000.00'),
            confidence_band_pct=Decimal('0.080'),
            lower_bound=Decimal('920000.00'),
            upper_bound=Decimal('1080000.00'),
            confidence_score=Decimal('0.850'),
            reliability_grade="A",
            method_consistency=Decimal('0.900'),
            risk_factors=[]
        )
        
        jurisdiction = JurisdictionPriors.get_default_priors("TX")
        
        # Marginal over-assessment that might not be worth appealing with costs
        zero_cost_input = DecisionInput(
            assessed_value=Decimal('1090000'),  # 9% over, just outside confidence band
            estimated_market_value=Decimal('1000000'),
            confidence_result=confidence,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.025'),
            estimated_filing_fee=Decimal('0'),      # No costs
            estimated_attorney_fee=Decimal('0'),
            estimated_other_costs=Decimal('0')
        )
        
        zero_cost_decision = make_appeal_decision(zero_cost_input)
        
        # With no costs, even small potential savings make sense
        assert zero_cost_decision.total_appeal_costs == Decimal('0.00')
        assert zero_cost_decision.net_savings_year_1 == zero_cost_decision.expected_annual_savings
        assert zero_cost_decision.expected_roi is None  # Can't calculate ROI with zero costs
        assert zero_cost_decision.breakeven_reduction_pct == Decimal('0.00')
        
    def test_import_all_functions(self):
        """Test that all functions can be imported from package root."""
        from charly_core_engine import (
            make_appeal_decision, DecisionInput, DecisionResult,
            calculate_confidence_band, ConfidenceInput, ConfidenceResult,
            JurisdictionPriors
        )
        
        # Should be able to import without errors
        assert callable(make_appeal_decision)
        assert callable(calculate_confidence_band)
        
        # Models should be available
        assert DecisionInput is not None
        assert ConfidenceInput is not None
        assert JurisdictionPriors is not None
        
    def test_real_world_scenario_simulation(self):
        """Test realistic end-to-end scenario with typical property."""
        
        # Scenario: $750K house in suburban Texas county
        # Recent sales in neighborhood: $720K, $780K, $740K, $770K
        # Assessed at $825K (10% over estimated market)
        
        confidence_input = ConfidenceInput(
            estimated_market_value=Decimal('750000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            comparable_sales=[
                Decimal('720000'),
                Decimal('780000'),
                Decimal('740000'),
                Decimal('770000')
            ],
            data_quality_score=Decimal('0.75'),  # Good but not perfect
            market_conditions="stable",
            property_uniqueness=Decimal('0.2'),  # Fairly typical suburban home
            days_since_valuation=90  # 3 months old
        )
        
        confidence_result = calculate_confidence_band(confidence_input)
        
        # Typical suburban county
        jurisdiction = JurisdictionPriors(
            jurisdiction_id="suburban_county_tx", 
            jurisdiction_name="Suburban County, TX",
            state="TX",
            appeal_success_rate=Decimal('0.38'),
            average_reduction_pct=Decimal('0.14'),
            typical_filing_fee=Decimal('500'),
            typical_attorney_cost=Decimal('2750'),
            cod_target=Decimal('0.10')
        )
        
        decision_input = DecisionInput(
            assessed_value=Decimal('825000'),  # 10% over
            estimated_market_value=Decimal('750000'),
            confidence_result=confidence_result,
            jurisdiction_priors=jurisdiction,
            tax_rate=Decimal('0.0278'),  # ~2.78% effective rate
            estimated_filing_fee=Decimal('500'),
            estimated_attorney_fee=Decimal('2750')
        )
        
        decision_result = make_appeal_decision(decision_input)
        
        # Analysis of results
        assert decision_result.assessment_ratio == Decimal('1.10')
        
        # Expected savings calculation:
        # Current tax: 825,000 * 0.0278 = $22,935
        # After 14% reduction: 825,000 * 0.86 = $709,500 (but capped at market $750,000)
        # Reduced assessment: $750,000 (market value)
        # New tax: 750,000 * 0.0278 = $20,850
        # Annual savings: 22,935 - 20,850 = $2,085
        
        expected_annual_savings = Decimal('2085.00')
        assert abs(decision_result.expected_annual_savings - expected_annual_savings) < Decimal('10.00')
        
        # Total costs: $3,250
        # 3-year ROI: ((2,085 * 3) - 3,250) / 3,250 * 100 = 92.5%
        expected_roi = Decimal('92.31')  # More precise calculation
        assert abs(decision_result.expected_roi - expected_roi) < Decimal('5.00')
        
        # Decision should likely be OVER given 10% over-assessment and positive ROI
        # But might be FAIR if within confidence band
        assert decision_result.decision in [AppealDecision.OVER, AppealDecision.FAIR]
        
        if decision_result.decision == AppealDecision.OVER:
            # Should have reasonable confidence for straightforward case
            assert decision_result.confidence_level in ["MEDIUM", "HIGH"]
        
        # Net first year should be negative due to upfront costs
        assert decision_result.net_savings_year_1 < 0
        
        # But cumulative should be positive
        assert decision_result.cumulative_net_savings > 0