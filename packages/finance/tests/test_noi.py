"""Tests for NOI calculations."""

import pytest
from decimal import Decimal
from hypothesis import given, strategies as st

from charly_finance.noi import calculate_noi, NOIInput, NOIResult


class TestNOIInput:
    """Test NOIInput validation."""
    
    def test_valid_input(self):
        """Test valid NOI input creation."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000'),
            vacancy_rate=Decimal('0.05'),
            property_taxes=Decimal('8000')
        )
        assert input_data.gross_rental_income == Decimal('100000')
        assert input_data.vacancy_rate == Decimal('0.05')
        
    def test_default_values(self):
        """Test default values are applied correctly."""
        input_data = NOIInput(gross_rental_income=Decimal('100000'))
        assert input_data.vacancy_rate == Decimal('0.05')
        assert input_data.other_income == Decimal('0')
        assert input_data.property_taxes == Decimal('0')
        
    def test_negative_income_rejected(self):
        """Test negative gross rental income is rejected."""
        with pytest.raises(ValueError):
            NOIInput(gross_rental_income=Decimal('-1000'))
            
    def test_excessive_vacancy_rate_rejected(self):
        """Test vacancy rate over 50% is rejected."""
        with pytest.raises(ValueError):
            NOIInput(
                gross_rental_income=Decimal('100000'),
                vacancy_rate=Decimal('0.6')
            )
            
    def test_string_conversion(self):
        """Test string inputs are converted to Decimal."""
        input_data = NOIInput(
            gross_rental_income='100000',
            vacancy_rate='0.05',
            property_taxes='8000'
        )
        assert isinstance(input_data.gross_rental_income, Decimal)
        assert isinstance(input_data.vacancy_rate, Decimal)


class TestNOICalculation:
    """Test NOI calculation logic."""
    
    def test_basic_noi_calculation(self):
        """Test basic NOI calculation."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000'),
            vacancy_rate=Decimal('0.05'),
            other_income=Decimal('5000'),
            property_taxes=Decimal('8000'),
            insurance=Decimal('2000'),
            maintenance=Decimal('5000')
        )
        
        result = calculate_noi(input_data)
        
        # Expected: (100000 - 5000 + 5000) - (8000 + 2000 + 5000) = 85000
        assert result.effective_gross_income == Decimal('100000.00')
        assert result.vacancy_loss == Decimal('5000.00')
        assert result.total_operating_expenses == Decimal('15000.00')
        assert result.net_operating_income == Decimal('85000.00')
        
    def test_zero_vacancy_rate(self):
        """Test calculation with zero vacancy."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000'),
            vacancy_rate=Decimal('0'),
            property_taxes=Decimal('8000')
        )
        
        result = calculate_noi(input_data)
        
        assert result.vacancy_loss == Decimal('0.00')
        assert result.effective_gross_income == Decimal('100000.00')
        
    def test_negative_noi_allowed(self):
        """Test that moderate negative NOI is allowed."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000'),
            property_taxes=Decimal('120000')  # Higher than gross income
        )
        
        result = calculate_noi(input_data)
        
        assert result.net_operating_income < 0
        
    def test_extreme_negative_noi_rejected(self):
        """Test that extreme negative NOI (>200% of income) is rejected."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000'),
            vacancy_rate=Decimal('0.1'),
            property_taxes=Decimal('300000')  # 3x effective gross income
        )
        
        with pytest.raises(ValueError, match="exceed 200%"):
            calculate_noi(input_data)
            
    def test_expense_breakdown(self):
        """Test expense breakdown is correctly populated."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000'),
            property_taxes=Decimal('8000'),
            insurance=Decimal('2000'),
            maintenance=Decimal('3000'),
            utilities=Decimal('1500'),
            management_fees=Decimal('4000'),
            other_expenses=Decimal('500')
        )
        
        result = calculate_noi(input_data)
        
        expected_breakdown = {
            'property_taxes': Decimal('8000.00'),
            'insurance': Decimal('2000.00'), 
            'maintenance': Decimal('3000.00'),
            'utilities': Decimal('1500.00'),
            'management_fees': Decimal('4000.00'),
            'other_expenses': Decimal('500.00')
        }
        
        assert result.expense_breakdown == expected_breakdown
        assert result.total_operating_expenses == Decimal('19000.00')
        
    def test_rounding_to_cents(self):
        """Test that results are rounded to nearest cent."""
        input_data = NOIInput(
            gross_rental_income=Decimal('100000.333'),
            vacancy_rate=Decimal('0.0533'),  # Will create fractional cents
            property_taxes=Decimal('8000.777')
        )
        
        result = calculate_noi(input_data)
        
        # All monetary amounts should be rounded to 2 decimal places
        assert str(result.effective_gross_income).count('.') == 1
        assert len(str(result.effective_gross_income).split('.')[-1]) == 2
        
    @given(
        gross_income=st.decimals(min_value=1, max_value=10000000, places=2),
        vacancy_rate=st.decimals(min_value=0, max_value=0.5, places=4),
        expenses=st.decimals(min_value=0, max_value=1000000, places=2)
    )
    def test_property_based_noi(self, gross_income, vacancy_rate, expenses):
        """Property-based test for NOI calculation."""
        input_data = NOIInput(
            gross_rental_income=gross_income,
            vacancy_rate=vacancy_rate,
            property_taxes=expenses
        )
        
        # Should not raise for reasonable inputs
        result = calculate_noi(input_data)
        
        # Basic invariants
        assert result.vacancy_loss >= 0
        assert result.vacancy_loss <= gross_income
        assert result.effective_gross_income <= gross_income
        assert result.total_operating_expenses >= 0


class TestNOIResult:
    """Test NOI result model."""
    
    def test_json_serialization(self):
        """Test NOI result can be serialized to JSON."""
        result = NOIResult(
            effective_gross_income=Decimal('100000.00'),
            total_operating_expenses=Decimal('15000.00'),
            net_operating_income=Decimal('85000.00'),
            vacancy_loss=Decimal('5000.00'),
            expense_breakdown={'property_taxes': Decimal('8000.00')}
        )
        
        # Should serialize without errors
        json_data = result.dict()
        
        # Decimals should be converted to floats
        assert isinstance(json_data['effective_gross_income'], Decimal)
        assert isinstance(json_data['expense_breakdown']['property_taxes'], Decimal)