"""Integration tests for finance package."""

import pytest
from decimal import Decimal

from charly_finance import (
    calculate_noi, NOIInput,
    calculate_cap_rate, CapRateInput,
    calculate_tax_savings, TaxSavingsInput
)


class TestFinanceIntegration:
    """Test integration between NOI, cap rate, and tax savings calculations."""
    
    def test_full_commercial_analysis_workflow(self):
        """Test complete workflow: NOI → Cap Rate → Tax Savings."""
        
        # Step 1: Calculate NOI
        noi_input = NOIInput(
            gross_rental_income=Decimal('120000'),
            vacancy_rate=Decimal('0.08'),
            other_income=Decimal('6000'),
            property_taxes=Decimal('12000'),
            insurance=Decimal('3000'),
            maintenance=Decimal('8000'),
            utilities=Decimal('2400'),
            management_fees=Decimal('6000')
        )
        
        noi_result = calculate_noi(noi_input)
        
        # Verify NOI calculation
        # EGI: (120000 - 9600 + 6000) = 116400
        # Expenses: 12000 + 3000 + 8000 + 2400 + 6000 = 31400
        # NOI: 116400 - 31400 = 85000
        assert noi_result.net_operating_income == Decimal('85000.00')
        
        # Step 2: Use NOI to calculate implied value at target cap rate
        cap_rate_input = CapRateInput(
            net_operating_income=noi_result.net_operating_income,
            target_cap_rate=Decimal('0.0850')  # 8.5% target
        )
        
        cap_rate_result = calculate_cap_rate(cap_rate_input)
        
        # Verify implied value: 85000 / 0.085 = 1,000,000
        assert cap_rate_result.implied_value == Decimal('1000000.00')
        
        # Step 3: Calculate tax savings if assessed at implied value vs current
        current_assessed = Decimal('1200000')  # Over-assessed
        
        tax_savings_input = TaxSavingsInput(
            current_assessed_value=current_assessed,
            proposed_assessed_value=cap_rate_result.implied_value,
            tax_rate=Decimal('28.5'),  # $28.50 per $1000
            filing_fee=Decimal('750'),
            attorney_fee=Decimal('3500'),
            years_of_savings=5
        )
        
        tax_savings_result = calculate_tax_savings(tax_savings_input)
        
        # Verify tax savings
        # Current tax: 1,200,000 * 0.0285 = 34,200
        # Proposed tax: 1,000,000 * 0.0285 = 28,500  
        # Annual savings: 34,200 - 28,500 = 5,700
        # Total costs: 750 + 3,500 = 4,250
        # 5-year savings: (5,700 * 5) - 4,250 = 24,250
        
        assert tax_savings_result.annual_savings == Decimal('5700.00')
        assert tax_savings_result.total_appeal_costs == Decimal('4250.00')
        assert tax_savings_result.cumulative_savings == Decimal('24250.00')
        
        # Verify this is a profitable appeal
        assert tax_savings_result.net_first_year_savings > 0
        assert tax_savings_result.payback_period_years < Decimal('1.00')
        assert tax_savings_result.roi_percentage > Decimal('100.00')
        
    def test_unprofitable_appeal_scenario(self):
        """Test scenario where appeal would not be profitable."""
        
        # Property with low NOI
        noi_input = NOIInput(
            gross_rental_income=Decimal('60000'),
            vacancy_rate=Decimal('0.12'),  # High vacancy
            property_taxes=Decimal('15000'),  # High taxes relative to income
            insurance=Decimal('2000'),
            maintenance=Decimal('12000'),  # High maintenance
            utilities=Decimal('3000'),
            management_fees=Decimal('3600')
        )
        
        noi_result = calculate_noi(noi_input)
        
        # Should result in low or negative NOI
        # EGI: 60000 - 7200 = 52800
        # Expenses: 15000 + 2000 + 12000 + 3000 + 3600 = 35600  
        # NOI: 52800 - 35600 = 17200
        assert noi_result.net_operating_income == Decimal('17200.00')
        
        # Current assessment might be close to market value
        current_assessed = Decimal('220000')
        
        # Calculate what NOI implies at reasonable cap rate
        cap_rate_input = CapRateInput(
            net_operating_income=noi_result.net_operating_income,
            target_cap_rate=Decimal('0.08')  # 8% cap rate
        )
        
        cap_rate_result = calculate_cap_rate(cap_rate_input)
        
        # Implied value: 17200 / 0.08 = 215000
        assert cap_rate_result.implied_value == Decimal('215000.00')
        
        # Small difference might not justify appeal costs
        tax_savings_input = TaxSavingsInput(
            current_assessed_value=current_assessed,
            proposed_assessed_value=cap_rate_result.implied_value,
            tax_rate=Decimal('25.0'),
            filing_fee=Decimal('500'),
            attorney_fee=Decimal('2500'),  # High relative to potential savings
            years_of_savings=3
        )
        
        tax_savings_result = calculate_tax_savings(tax_savings_input)
        
        # Savings: (220000 - 215000) * 0.025 = 125/year
        # Costs: 3000
        # This would not be profitable
        assert tax_savings_result.annual_savings == Decimal('125.00')
        assert tax_savings_result.net_first_year_savings < 0
        assert tax_savings_result.cumulative_savings < 0
        
    def test_edge_case_zero_noi(self):
        """Test edge case where property has exactly zero NOI."""
        
        noi_input = NOIInput(
            gross_rental_income=Decimal('50000'),
            vacancy_rate=Decimal('0.1'),
            property_taxes=Decimal('25000'),
            insurance=Decimal('2000'),
            maintenance=Decimal('8000'),
            utilities=Decimal('3000'),
            management_fees=Decimal('2000'),
            other_expenses=Decimal('5000')
        )
        
        noi_result = calculate_noi(noi_input)
        
        # EGI: 50000 - 5000 = 45000
        # Expenses: 25000 + 2000 + 8000 + 3000 + 2000 + 5000 = 45000
        # NOI: 45000 - 45000 = 0
        assert noi_result.net_operating_income == Decimal('0.00')
        
        # Zero NOI implies zero value at any positive cap rate
        cap_rate_input = CapRateInput(
            net_operating_income=noi_result.net_operating_income,
            target_cap_rate=Decimal('0.08')
        )
        
        cap_rate_result = calculate_cap_rate(cap_rate_input)
        
        assert cap_rate_result.implied_value == Decimal('0.00')
        
    def test_negative_noi_propagation(self):
        """Test how negative NOI propagates through calculations."""
        
        # Property losing money
        noi_input = NOIInput(
            gross_rental_income=Decimal('40000'),
            vacancy_rate=Decimal('0.15'),
            property_taxes=Decimal('30000'),  # Very high taxes
            insurance=Decimal('3000'),
            maintenance=Decimal('15000')
        )
        
        noi_result = calculate_noi(noi_input)
        
        # EGI: 40000 - 6000 = 34000
        # Expenses: 30000 + 3000 + 15000 = 48000
        # NOI: 34000 - 48000 = -14000
        assert noi_result.net_operating_income == Decimal('-14000.00')
        
        # Negative NOI with positive cap rate gives negative implied value
        cap_rate_input = CapRateInput(
            net_operating_income=noi_result.net_operating_income,
            target_cap_rate=Decimal('0.08')
        )
        
        cap_rate_result = calculate_cap_rate(cap_rate_input)
        
        assert cap_rate_result.implied_value == Decimal('-175000.00')
        assert cap_rate_result.negative_noi_warning is True
        
        # This should indicate property is severely over-assessed
        current_assessed = Decimal('500000')
        
        tax_savings_input = TaxSavingsInput(
            current_assessed_value=current_assessed,
            proposed_assessed_value=Decimal('100000'),  # Minimum reasonable value
            tax_rate=Decimal('30.0'),
            filing_fee=Decimal('500'),
            attorney_fee=Decimal('5000'),
            years_of_savings=3
        )
        
        tax_savings_result = calculate_tax_savings(tax_savings_input)
        
        # Should show substantial savings opportunity
        # Current: 500000 * 0.03 = 15000
        # Proposed: 100000 * 0.03 = 3000
        # Annual savings: 12000
        assert tax_savings_result.annual_savings == Decimal('12000.00')
        assert tax_savings_result.cumulative_savings > Decimal('30000.00')
        
    def test_import_all_functions(self):
        """Test that all functions can be imported from package root."""
        from charly_finance import (
            calculate_noi, NOIInput, NOIResult,
            calculate_cap_rate, CapRateInput, CapRateResult,
            calculate_tax_savings, TaxSavingsInput, TaxSavingsResult
        )
        
        # Should be able to import without errors
        assert callable(calculate_noi)
        assert callable(calculate_cap_rate) 
        assert callable(calculate_tax_savings)
        
        # Models should be available
        assert NOIInput is not None
        assert CapRateInput is not None
        assert TaxSavingsInput is not None