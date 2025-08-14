"""Tests for confidence band calculations."""

import pytest
from decimal import Decimal
from hypothesis import given, strategies as st

from charly_core_engine.confidence import (
    calculate_confidence_band, ConfidenceInput, ConfidenceResult, 
    ValuationMethod
)


class TestConfidenceInput:
    """Test ConfidenceInput validation."""
    
    def test_valid_input_creation(self):
        """Test creating valid confidence input."""
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            comparable_sales=[Decimal('950000'), Decimal('1050000')],
            data_quality_score=Decimal('0.9')
        )
        
        assert input_data.estimated_market_value == Decimal('1000000')
        assert input_data.valuation_method == ValuationMethod.SALES_COMPARISON
        assert len(input_data.comparable_sales) == 2
        
    def test_default_values(self):
        """Test default values are applied correctly."""
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.INCOME_APPROACH
        )
        
        assert input_data.comparable_sales == []
        assert input_data.other_estimates == []
        assert input_data.data_quality_score == Decimal('0.8')
        assert input_data.market_conditions == "stable"
        assert input_data.property_uniqueness == Decimal('0.5')
        assert input_data.days_since_valuation == 0
        
    def test_zero_market_value_rejected(self):
        """Test zero market value is rejected."""
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('0'),
                valuation_method=ValuationMethod.SALES_COMPARISON
            )
            
    def test_negative_market_value_rejected(self):
        """Test negative market value is rejected."""
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('-100000'),
                valuation_method=ValuationMethod.SALES_COMPARISON
            )
            
    def test_data_quality_score_bounds(self):
        """Test data quality score validation."""
        # Valid scores
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            data_quality_score=Decimal('0.0')  # Minimum
        )
        assert input_data.data_quality_score == Decimal('0.0')
        
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            data_quality_score=Decimal('1.0')  # Maximum
        )
        assert input_data.data_quality_score == Decimal('1.0')
        
        # Invalid scores
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                data_quality_score=Decimal('-0.1')
            )
            
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                data_quality_score=Decimal('1.1')
            )
            
    def test_market_conditions_validation(self):
        """Test market conditions validation."""
        valid_conditions = ["stable", "improving", "declining", "volatile"]
        
        for condition in valid_conditions:
            input_data = ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                market_conditions=condition
            )
            assert input_data.market_conditions == condition
            
        # Test case insensitive
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            market_conditions="STABLE"  # Uppercase
        )
        assert input_data.market_conditions == "stable"  # Normalized to lowercase
        
        # Invalid condition
        with pytest.raises(ValueError, match="Market conditions must be"):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                market_conditions="booming"  # Not in valid list
            )
            
    def test_property_uniqueness_bounds(self):
        """Test property uniqueness validation.""" 
        # Valid values
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            property_uniqueness=Decimal('0.0')  # Common property
        )
        assert input_data.property_uniqueness == Decimal('0.0')
        
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            property_uniqueness=Decimal('1.0')  # Unique property
        )
        assert input_data.property_uniqueness == Decimal('1.0')
        
        # Invalid values
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                property_uniqueness=Decimal('-0.1')
            )
            
    def test_days_since_valuation_bounds(self):
        """Test days since valuation validation."""
        # Valid range
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            days_since_valuation=0  # Same day
        )
        assert input_data.days_since_valuation == 0
        
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            days_since_valuation=1095  # 3 years
        )
        assert input_data.days_since_valuation == 1095
        
        # Invalid values
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                days_since_valuation=-1  # Negative
            )
            
        with pytest.raises(ValueError):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                days_since_valuation=1096  # Over 3 years
            )
            
    def test_other_estimates_validation(self):
        """Test other estimates validation."""
        # Valid estimates
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            other_estimates=[
                (Decimal('950000'), ValuationMethod.COST_APPROACH),
                (Decimal('1050000'), ValuationMethod.INCOME_APPROACH)
            ]
        )
        assert len(input_data.other_estimates) == 2
        
        # Too many estimates
        too_many_estimates = [(Decimal('1000000'), ValuationMethod.SALES_COMPARISON)] * 11
        with pytest.raises(ValueError, match="Too many other estimates"):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                other_estimates=too_many_estimates
            )
            
        # Negative estimate
        with pytest.raises(ValueError, match="All estimates must be positive"):
            ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=ValuationMethod.SALES_COMPARISON,
                other_estimates=[(Decimal('-100000'), ValuationMethod.COST_APPROACH)]
            )


class TestConfidenceBandCalculation:
    """Test confidence band calculation logic."""
    
    def test_basic_confidence_calculation(self):
        """Test basic confidence band calculation."""
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            data_quality_score=Decimal('0.8'),
            market_conditions="stable"
        )
        
        result = calculate_confidence_band(input_data)
        
        # Sales comparison should start with 10% base band
        # Good data quality (0.8) should not adjust much
        # Stable market should not adjust
        # Should be close to base 10% band
        
        assert result.central_estimate == Decimal('1000000.00')
        assert result.confidence_band_pct >= Decimal('0.100')  # At least 10%
        assert result.confidence_band_pct <= Decimal('0.150')  # Not too much higher
        
        expected_band_amount = result.central_estimate * result.confidence_band_pct
        assert result.lower_bound == result.central_estimate - expected_band_amount
        assert result.upper_bound == result.central_estimate + expected_band_amount
        
    def test_valuation_method_base_bands(self):
        """Test different valuation methods produce different base confidence bands."""
        methods_and_expected_minimums = [
            (ValuationMethod.SALES_COMPARISON, Decimal('0.10')),   # Lowest uncertainty
            (ValuationMethod.INCOME_APPROACH, Decimal('0.15')),    
            (ValuationMethod.COST_APPROACH, Decimal('0.20')),      
            (ValuationMethod.AUTOMATED_VALUATION, Decimal('0.25')),
            (ValuationMethod.TAX_ASSESSOR, Decimal('0.30'))        # Highest uncertainty
        ]
        
        for method, min_band in methods_and_expected_minimums:
            input_data = ConfidenceInput(
                estimated_market_value=Decimal('1000000'),
                valuation_method=method,
                data_quality_score=Decimal('1.0'),  # Perfect data
                market_conditions="stable"
            )
            
            result = calculate_confidence_band(input_data)
            
            # Should be at least the method's base band
            assert result.confidence_band_pct >= min_band, f"Method {method} band too small"
            
    def test_data_quality_adjustment(self):
        """Test data quality affects confidence band."""
        base_input = {
            "estimated_market_value": Decimal('1000000'),
            "valuation_method": ValuationMethod.SALES_COMPARISON,
            "market_conditions": "stable"
        }
        
        # High quality data
        high_quality = ConfidenceInput(**base_input, data_quality_score=Decimal('0.9'))
        high_result = calculate_confidence_band(high_quality)
        
        # Low quality data
        low_quality = ConfidenceInput(**base_input, data_quality_score=Decimal('0.3'))
        low_result = calculate_confidence_band(low_quality)
        
        # Low quality should have wider confidence band
        assert low_result.confidence_band_pct > high_result.confidence_band_pct
        assert low_result.confidence_score < high_result.confidence_score
        
    def test_market_conditions_adjustment(self):
        """Test market conditions affect confidence band."""
        base_input = {
            "estimated_market_value": Decimal('1000000'),
            "valuation_method": ValuationMethod.SALES_COMPARISON,
            "data_quality_score": Decimal('0.8')
        }
        
        stable_input = ConfidenceInput(**base_input, market_conditions="stable")
        stable_result = calculate_confidence_band(stable_input)
        
        volatile_input = ConfidenceInput(**base_input, market_conditions="volatile")
        volatile_result = calculate_confidence_band(volatile_input)
        
        # Volatile market should have wider band
        assert volatile_result.confidence_band_pct > stable_result.confidence_band_pct
        assert volatile_result.confidence_score < stable_result.confidence_score
        
    def test_property_uniqueness_adjustment(self):
        """Test property uniqueness affects confidence band."""
        base_input = {
            "estimated_market_value": Decimal('1000000'),
            "valuation_method": ValuationMethod.SALES_COMPARISON,
            "data_quality_score": Decimal('0.8'),
            "market_conditions": "stable"
        }
        
        common_input = ConfidenceInput(**base_input, property_uniqueness=Decimal('0.1'))
        common_result = calculate_confidence_band(common_input)
        
        unique_input = ConfidenceInput(**base_input, property_uniqueness=Decimal('0.9'))
        unique_result = calculate_confidence_band(unique_input)
        
        # Unique property should have wider band
        assert unique_result.confidence_band_pct > common_result.confidence_band_pct
        
    def test_valuation_age_adjustment(self):
        """Test valuation age affects confidence band."""
        base_input = {
            "estimated_market_value": Decimal('1000000'),
            "valuation_method": ValuationMethod.SALES_COMPARISON,
            "data_quality_score": Decimal('0.8'),
            "market_conditions": "stable"
        }
        
        recent_input = ConfidenceInput(**base_input, days_since_valuation=0)
        recent_result = calculate_confidence_band(recent_input)
        
        old_input = ConfidenceInput(**base_input, days_since_valuation=730)  # 2 years
        old_result = calculate_confidence_band(old_input)
        
        # Older valuation should have wider band
        assert old_result.confidence_band_pct > recent_result.confidence_band_pct
        
    def test_multiple_estimates_dispersion(self):
        """Test multiple estimates affect confidence through dispersion."""
        # Consistent estimates
        consistent_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            comparable_sales=[Decimal('990000'), Decimal('1010000')],  # Close to primary
            other_estimates=[(Decimal('995000'), ValuationMethod.COST_APPROACH)]
        )
        consistent_result = calculate_confidence_band(consistent_input)
        
        # Dispersed estimates
        dispersed_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            comparable_sales=[Decimal('800000'), Decimal('1200000')],  # Wide range
            other_estimates=[(Decimal('750000'), ValuationMethod.COST_APPROACH)]
        )
        dispersed_result = calculate_confidence_band(dispersed_input)
        
        # Dispersed estimates should have wider band and lower consistency
        assert dispersed_result.confidence_band_pct > consistent_result.confidence_band_pct
        assert dispersed_result.method_consistency < consistent_result.method_consistency
        assert dispersed_result.estimate_dispersion > consistent_result.estimate_dispersion
        
    def test_confidence_score_and_grade_assignment(self):
        """Test confidence score calculation and grade assignment."""
        # High confidence scenario
        high_conf_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,
            data_quality_score=Decimal('0.9'),
            market_conditions="stable",
            comparable_sales=[Decimal('995000'), Decimal('1005000')]
        )
        high_result = calculate_confidence_band(high_conf_input)
        
        # Low confidence scenario
        low_conf_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.TAX_ASSESSOR,
            data_quality_score=Decimal('0.3'),
            market_conditions="volatile",
            property_uniqueness=Decimal('0.9'),
            days_since_valuation=700
        )
        low_result = calculate_confidence_band(low_conf_input)
        
        # High confidence should have higher score and better grade
        assert high_result.confidence_score > low_result.confidence_score
        
        # Grade assignment
        grade_order = ["A", "B", "C", "D"]
        assert grade_order.index(high_result.reliability_grade) < grade_order.index(low_result.reliability_grade)
        
    def test_risk_factors_identification(self):
        """Test risk factors are correctly identified."""
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,  # But limited comps
            data_quality_score=Decimal('0.4'),  # Low quality
            market_conditions="volatile",       # Unstable
            property_uniqueness=Decimal('0.8'), # Highly unique
            days_since_valuation=400,          # Over 1 year old
            comparable_sales=[Decimal('900000'), Decimal('1200000')]  # High dispersion
        )
        
        result = calculate_confidence_band(input_data)
        
        expected_risk_factors = [
            "Low data quality",
            "Highly unique property", 
            "Unstable market conditions (volatile)",
            "Valuation more than 1 year old",
            "Limited comparable sales data",
            "High dispersion between estimates"
        ]
        
        # Should identify most of these risk factors
        for expected_risk in expected_risk_factors:
            assert any(expected_risk in risk for risk in result.risk_factors), f"Missing risk factor: {expected_risk}"
            
    def test_confidence_band_limits(self):
        """Test confidence band is capped at reasonable limits."""
        # Scenario designed to create very wide band
        extreme_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.TAX_ASSESSOR,  # 30% base
            data_quality_score=Decimal('0.0'),  # Worst quality (+15%)
            market_conditions="volatile",       # +12%
            property_uniqueness=Decimal('1.0'), # +10%
            days_since_valuation=1095,         # +15% (3 years)
            # This would normally create >80% band, but should be capped at 50%
        )
        
        result = calculate_confidence_band(extreme_input)
        
        # Should be capped at 50%
        assert result.confidence_band_pct <= Decimal('0.500')
        
        # Should also have minimum of 5%
        minimal_input = ConfidenceInput(
            estimated_market_value=Decimal('1000000'),
            valuation_method=ValuationMethod.SALES_COMPARISON,  # 10% base
            data_quality_score=Decimal('1.0'),  # Perfect quality
            market_conditions="stable",         # No adjustment
            property_uniqueness=Decimal('0.0'), # Common property
            days_since_valuation=0              # Fresh valuation
        )
        
        minimal_result = calculate_confidence_band(minimal_input)
        assert minimal_result.confidence_band_pct >= Decimal('0.050')
        
    def test_rounding_precision(self):
        """Test that results are properly rounded."""
        input_data = ConfidenceInput(
            estimated_market_value=Decimal('1000000.333'),
            valuation_method=ValuationMethod.SALES_COMPARISON
        )
        
        result = calculate_confidence_band(input_data)
        
        # Currency amounts should be rounded to cents
        assert len(str(result.central_estimate).split('.')[-1]) == 2
        assert len(str(result.lower_bound).split('.')[-1]) == 2
        assert len(str(result.upper_bound).split('.')[-1]) == 2
        
        # Percentages should be rounded to 3 decimal places
        assert len(str(result.confidence_band_pct).split('.')[-1]) <= 3
        assert len(str(result.confidence_score).split('.')[-1]) <= 3
        
    @given(
        market_value=st.decimals(min_value=100000, max_value=10000000, places=2),
        data_quality=st.decimals(min_value=0, max_value=1, places=2),
        uniqueness=st.decimals(min_value=0, max_value=1, places=2),
        days_old=st.integers(min_value=0, max_value=1000)
    )
    def test_property_based_confidence(self, market_value, data_quality, uniqueness, days_old):
        """Property-based test for confidence calculation."""
        input_data = ConfidenceInput(
            estimated_market_value=market_value,
            valuation_method=ValuationMethod.SALES_COMPARISON,
            data_quality_score=data_quality,
            property_uniqueness=uniqueness,
            days_since_valuation=days_old
        )
        
        result = calculate_confidence_band(input_data)
        
        # Basic invariants
        assert result.central_estimate == market_value.quantize(Decimal('0.01'))
        assert result.lower_bound < result.upper_bound
        assert result.lower_bound > 0  # Should never go negative
        assert Decimal('0.05') <= result.confidence_band_pct <= Decimal('0.50')
        assert Decimal('0.0') <= result.confidence_score <= Decimal('1.0')
        assert result.reliability_grade in ["A", "B", "C", "D"]