"""Tests for tax savings calculations."""

import pytest
from decimal import Decimal
from hypothesis import given, strategies as st

from charly_finance.tax_savings import calculate_tax_savings, TaxSavingsInput, TaxSavingsResult


class TestTaxSavingsInput:
    """Test TaxSavingsInput validation."""
    
    def test_valid_input(self):
        """Test valid tax savings input creation."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),
            filing_fee=Decimal('500'),
            years_of_savings=3
        )
        
        assert input_data.current_assessed_value == Decimal('1000000')
        assert input_data.proposed_assessed_value == Decimal('800000')
        assert input_data.tax_rate == Decimal('25.5')
        assert input_data.tax_rate_per_thousand is True  # default
        
    def test_mill_rate_input(self):
        """Test input with mill rate instead of per-thousand rate."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),
            tax_rate_per_thousand=False
        )
        
        assert input_data.tax_rate_per_thousand is False
        
    def test_zero_assessed_value_rejected(self):
        """Test zero assessed values are rejected."""
        with pytest.raises(ValueError):
            TaxSavingsInput(
                current_assessed_value=Decimal('0'),
                proposed_assessed_value=Decimal('800000'),
                tax_rate=Decimal('25.5')
            )
            
    def test_negative_assessed_value_rejected(self):
        """Test negative assessed values are rejected."""
        with pytest.raises(ValueError):
            TaxSavingsInput(
                current_assessed_value=Decimal('-1000'),
                proposed_assessed_value=Decimal('800000'),
                tax_rate=Decimal('25.5')
            )
            
    def test_excessive_tax_rate_rejected(self):
        """Test excessive tax rates are rejected."""
        with pytest.raises(ValueError, match="too high"):
            TaxSavingsInput(
                current_assessed_value=Decimal('1000000'),
                proposed_assessed_value=Decimal('800000'),
                tax_rate=Decimal('250'),  # $250 per $1000
                tax_rate_per_thousand=True
            )
            
    def test_excessive_mill_rate_rejected(self):
        """Test excessive mill rates are rejected."""
        with pytest.raises(ValueError, match="too high"):
            TaxSavingsInput(
                current_assessed_value=Decimal('1000000'),
                proposed_assessed_value=Decimal('800000'),
                tax_rate=Decimal('250'),  # 250 mills
                tax_rate_per_thousand=False
            )
            
    def test_proposed_value_higher_allowed(self):
        """Test that proposed value higher than current is allowed (for 'Under' scenarios)."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('800000'),
            proposed_assessed_value=Decimal('1000000'),  # Higher
            tax_rate=Decimal('25.5')
        )
        
        assert input_data.proposed_assessed_value > input_data.current_assessed_value
        
    def test_years_of_savings_bounds(self):
        """Test years_of_savings validation."""
        # Valid range
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),
            years_of_savings=5
        )
        assert input_data.years_of_savings == 5
        
        # Too low
        with pytest.raises(ValueError):
            TaxSavingsInput(
                current_assessed_value=Decimal('1000000'),
                proposed_assessed_value=Decimal('800000'),
                tax_rate=Decimal('25.5'),
                years_of_savings=0
            )
            
        # Too high  
        with pytest.raises(ValueError):
            TaxSavingsInput(
                current_assessed_value=Decimal('1000000'),
                proposed_assessed_value=Decimal('800000'),
                tax_rate=Decimal('25.5'),
                years_of_savings=15
            )


class TestTaxSavingsCalculation:
    """Test tax savings calculation logic."""
    
    def test_basic_tax_savings_calculation(self):
        """Test basic tax savings calculation."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),  # $25.50 per $1000
            filing_fee=Decimal('500'),
            attorney_fee=Decimal('2000'),
            years_of_savings=3
        )
        
        result = calculate_tax_savings(input_data)
        
        # Expected calculations:
        # Current tax: 1,000,000 * 0.0255 = $25,500
        # Proposed tax: 800,000 * 0.0255 = $20,400  
        # Annual savings: $25,500 - $20,400 = $5,100
        # Total costs: $500 + $2,000 = $2,500
        # Net first year: $5,100 - $2,500 = $2,600
        # Cumulative (3 years): ($5,100 * 3) - $2,500 = $12,800
        
        assert result.annual_tax_current == Decimal('25500.00')
        assert result.annual_tax_proposed == Decimal('20400.00')
        assert result.annual_savings == Decimal('5100.00')
        assert result.total_appeal_costs == Decimal('2500.00')
        assert result.net_first_year_savings == Decimal('2600.00')
        assert result.cumulative_savings == Decimal('12800.00')
        
    def test_mill_rate_calculation(self):
        """Test calculation with mill rate."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),  # 25.5 mills
            tax_rate_per_thousand=False,
            years_of_savings=1
        )
        
        result = calculate_tax_savings(input_data)
        
        # Mill rate calculation should give same result as per-thousand
        # 25.5 mills = $25.50 per $1000
        assert result.annual_tax_current == Decimal('25500.00')
        assert result.annual_tax_proposed == Decimal('20400.00')
        
    def test_value_increase_scenario(self):
        """Test scenario where proposed value is higher (Under assessment)."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('800000'),
            proposed_assessed_value=Decimal('1000000'),  # Increase
            tax_rate=Decimal('25.5'),
            years_of_savings=1
        )
        
        result = calculate_tax_savings(input_data)
        
        # Should flag value increase and negative savings
        assert result.value_increase_warning is True
        assert result.negative_savings_warning is True
        assert result.annual_savings < 0
        
    def test_no_appeal_costs(self):
        """Test calculation with zero appeal costs."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),
            years_of_savings=1
        )
        
        result = calculate_tax_savings(input_data)
        
        assert result.total_appeal_costs == Decimal('0.00')
        assert result.net_first_year_savings == result.annual_savings
        assert result.payback_period_years is None  # No costs to recoup
        assert result.roi_percentage is None  # Can't calculate ROI with zero costs
        
    def test_payback_period_calculation(self):
        """Test payback period calculation."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),
            filing_fee=Decimal('2550'),  # Half of annual savings
            years_of_savings=3
        )
        
        result = calculate_tax_savings(input_data)
        
        # Annual savings: $5,100
        # Total costs: $2,550
        # Payback: $2,550 / $5,100 = 0.5 years
        assert result.payback_period_years == Decimal('0.50')
        
    def test_roi_calculation(self):
        """Test ROI calculation."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('800000'),
            tax_rate=Decimal('25.5'),
            filing_fee=Decimal('1000'),
            years_of_savings=2
        )
        
        result = calculate_tax_savings(input_data)
        
        # Annual savings: $5,100
        # Total costs: $1,000
        # Total benefit (2 years): $10,200
        # ROI: (($10,200 - $1,000) / $1,000) * 100 = 920%
        assert result.roi_percentage == Decimal('920.00')
        
    def test_zero_savings_scenario(self):
        """Test scenario with zero savings (same assessed values)."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000'),
            proposed_assessed_value=Decimal('1000000'),  # Same value
            tax_rate=Decimal('25.5'),
            filing_fee=Decimal('500'),
            years_of_savings=1
        )
        
        result = calculate_tax_savings(input_data)
        
        assert result.annual_savings == Decimal('0.00')
        assert result.net_first_year_savings == Decimal('-500.00')  # Just costs
        assert result.payback_period_years is None  # No savings to recoup costs
        assert not result.value_increase_warning
        assert not result.negative_savings_warning
        
    def test_rounding_to_cents(self):
        """Test that all monetary amounts are rounded to cents."""
        input_data = TaxSavingsInput(
            current_assessed_value=Decimal('1000000.333'),
            proposed_assessed_value=Decimal('800000.777'),
            tax_rate=Decimal('25.567'),  # Creates fractional cents
            filing_fee=Decimal('499.999'),
            years_of_savings=1
        )
        
        result = calculate_tax_savings(input_data)
        
        # All monetary fields should be rounded to 2 decimal places
        monetary_fields = [
            result.annual_tax_current,
            result.annual_tax_proposed,
            result.annual_savings,
            result.total_appeal_costs,
            result.net_first_year_savings,
            result.cumulative_savings
        ]
        
        for amount in monetary_fields:
            assert len(str(amount).split('.')[-1]) == 2
            
    @given(
        current_value=st.decimals(min_value=100000, max_value=10000000, places=2),
        proposed_value=st.decimals(min_value=50000, max_value=10000000, places=2),
        tax_rate=st.decimals(min_value=1, max_value=100, places=3),
        costs=st.decimals(min_value=0, max_value=50000, places=2),
        years=st.integers(min_value=1, max_value=10)
    )
    def test_property_based_tax_savings(self, current_value, proposed_value, tax_rate, costs, years):
        """Property-based test for tax savings calculation."""
        input_data = TaxSavingsInput(
            current_assessed_value=current_value,
            proposed_assessed_value=proposed_value,
            tax_rate=tax_rate,
            filing_fee=costs,
            years_of_savings=years
        )
        
        result = calculate_tax_savings(input_data)
        
        # Basic invariants
        assert result.total_appeal_costs >= 0
        
        # Tax amounts should be proportional to assessed values
        if current_value > proposed_value:
            assert result.annual_tax_current > result.annual_tax_proposed
            assert result.annual_savings > 0
            assert not result.negative_savings_warning
        elif current_value < proposed_value:
            assert result.annual_tax_current < result.annual_tax_proposed
            assert result.annual_savings < 0
            assert result.negative_savings_warning
            assert result.value_increase_warning
        else:  # Equal values
            assert result.annual_tax_current == result.annual_tax_proposed
            assert result.annual_savings == 0


class TestTaxSavingsResult:
    """Test TaxSavingsResult model."""
    
    def test_json_serialization(self):
        """Test tax savings result can be serialized to JSON."""
        result = TaxSavingsResult(
            annual_tax_current=Decimal('25500.00'),
            annual_tax_proposed=Decimal('20400.00'),
            annual_savings=Decimal('5100.00'),
            total_appeal_costs=Decimal('2500.00'),
            net_first_year_savings=Decimal('2600.00'),
            cumulative_savings=Decimal('12800.00'),
            payback_period_years=Decimal('0.49'),
            roi_percentage=Decimal('412.00'),
            value_increase_warning=False,
            negative_savings_warning=False
        )
        
        # Should serialize without errors
        json_data = result.dict()
        
        # Decimals should be preserved
        assert isinstance(json_data['annual_savings'], Decimal)
        assert isinstance(json_data['roi_percentage'], Decimal)