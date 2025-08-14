"""Tests for jurisdiction priors and statistics."""

import pytest
from decimal import Decimal
from hypothesis import given, strategies as st

from charly_core_engine.jurisdiction import JurisdictionPriors


class TestJurisdictionPriors:
    """Test JurisdictionPriors model."""
    
    def test_valid_priors_creation(self):
        """Test creating valid jurisdiction priors."""
        priors = JurisdictionPriors(
            jurisdiction_id="travis_county_tx",
            jurisdiction_name="Travis County, TX",
            state="TX",
            appeal_success_rate=Decimal('0.42'),
            typical_filing_fee=Decimal('500'),
            average_timeline_days=180
        )
        
        assert priors.jurisdiction_id == "travis_county_tx"
        assert priors.state == "TX"
        assert priors.appeal_success_rate == Decimal('0.42')
        
    def test_default_values(self):
        """Test default values are applied correctly."""
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test County",
            state="CA"
        )
        
        assert priors.appeal_success_rate == Decimal('0.35')
        assert priors.average_reduction_pct == Decimal('0.15')
        assert priors.typical_attorney_cost == Decimal('2500')
        assert priors.cod_target == Decimal('0.10')
        assert priors.reassessment_risk_factor == Decimal('0.05')
        assert priors.uses_market_value is True
        assert priors.assessment_ratio == Decimal('1.0')
        
    def test_state_code_validation(self):
        """Test state code validation and normalization."""
        # Lowercase should be converted to uppercase
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test County",
            state="tx"  # lowercase
        )
        assert priors.state == "TX"
        
        # Invalid state codes should be rejected
        with pytest.raises(ValueError, match="two-letter code"):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test County",  
                state="Texas"  # Too long
            )
            
        with pytest.raises(ValueError, match="two-letter code"):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test County",
                state="T1"  # Contains number
            )
            
    def test_success_rate_bounds(self):
        """Test appeal success rate validation."""
        # Valid rates
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            appeal_success_rate=Decimal('0.0')  # 0% success rate
        )
        assert priors.appeal_success_rate == Decimal('0.0')
        
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX", 
            appeal_success_rate=Decimal('1.0')  # 100% success rate
        )
        assert priors.appeal_success_rate == Decimal('1.0')
        
        # Invalid rates
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                appeal_success_rate=Decimal('-0.1')  # Negative
            )
            
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test", 
                jurisdiction_name="Test",
                state="TX",
                appeal_success_rate=Decimal('1.1')  # Over 100%
            )
            
    def test_negative_costs_rejected(self):
        """Test that negative costs are rejected."""
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                typical_filing_fee=Decimal('-100')
            )
            
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                typical_attorney_cost=Decimal('-1000')
            )
            
    def test_timeline_bounds(self):
        """Test timeline validation."""
        # Valid timelines
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            average_timeline_days=30  # Minimum
        )
        assert priors.average_timeline_days == 30
        
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test", 
            state="TX",
            average_timeline_days=730  # Maximum (2 years)
        )
        assert priors.average_timeline_days == 730
        
        # Invalid timelines
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                average_timeline_days=15  # Too short
            )
            
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX", 
                average_timeline_days=800  # Too long
            )
            
    def test_cod_target_validation(self):
        """Test COD target validation."""
        # Valid COD targets
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            cod_target=Decimal('0.05')  # 5%
        )
        assert priors.cod_target == Decimal('0.05')
        
        # Zero or negative COD rejected
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                cod_target=Decimal('0')
            )
            
        # Very high COD rejected
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test", 
                state="TX",
                cod_target=Decimal('0.6')  # 60%
            )
            
    def test_assessment_ratio_validation(self):
        """Test assessment ratio validation."""
        # Valid ratios
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            assessment_ratio=Decimal('0.5')  # 50% of market value
        )
        assert priors.assessment_ratio == Decimal('0.5')
        
        # Zero or negative ratio rejected
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                assessment_ratio=Decimal('0')
            )
            
        # Ratio over 100% rejected
        with pytest.raises(ValueError):
            JurisdictionPriors(
                jurisdiction_id="test",
                jurisdiction_name="Test",
                state="TX",
                assessment_ratio=Decimal('1.1')
            )
            
    def test_string_to_decimal_conversion(self):
        """Test automatic string to Decimal conversion."""
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            appeal_success_rate="0.42",  # String
            typical_filing_fee="500",     # String
            cod_target="0.08"            # String
        )
        
        assert isinstance(priors.appeal_success_rate, Decimal)
        assert isinstance(priors.typical_filing_fee, Decimal)
        assert isinstance(priors.cod_target, Decimal)
        
    def test_get_default_priors(self):
        """Test default priors generation."""
        default_tx = JurisdictionPriors.get_default_priors("TX")
        
        assert default_tx.jurisdiction_id == "default_tx"
        assert default_tx.jurisdiction_name == "Default TX Jurisdiction"
        assert default_tx.state == "TX"
        assert default_tx.appeal_success_rate == Decimal('0.30')  # Conservative
        assert default_tx.typical_filing_fee == Decimal('500')
        assert default_tx.typical_attorney_cost == Decimal('3000')
        
        # Test with lowercase state
        default_ca = JurisdictionPriors.get_default_priors("ca")
        assert default_ca.state == "CA"  # Should be normalized
        assert default_ca.jurisdiction_id == "default_ca"
        
    def test_optional_last_revaluation_year(self):
        """Test optional last revaluation year field."""
        # With revaluation year
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test",
            state="TX",
            last_revaluation_year=2020
        )
        assert priors.last_revaluation_year == 2020
        
        # Without revaluation year (None)
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test", 
            state="TX"
        )
        assert priors.last_revaluation_year is None
        
    @given(
        success_rate=st.decimals(min_value=0, max_value=1, places=3),
        filing_fee=st.decimals(min_value=0, max_value=5000, places=2),
        timeline=st.integers(min_value=30, max_value=730)
    )
    def test_property_based_priors(self, success_rate, filing_fee, timeline):
        """Property-based test for jurisdiction priors."""
        priors = JurisdictionPriors(
            jurisdiction_id="test",
            jurisdiction_name="Test County",
            state="TX",
            appeal_success_rate=success_rate,
            typical_filing_fee=filing_fee,
            average_timeline_days=timeline
        )
        
        # Basic invariants
        assert 0 <= priors.appeal_success_rate <= 1
        assert priors.typical_filing_fee >= 0
        assert 30 <= priors.average_timeline_days <= 730
        assert priors.state == "TX"