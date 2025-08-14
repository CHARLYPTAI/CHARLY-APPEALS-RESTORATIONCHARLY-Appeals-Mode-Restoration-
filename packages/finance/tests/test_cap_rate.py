"""Tests for cap rate calculations."""

import pytest
from decimal import Decimal
from hypothesis import given, strategies as st

from charly_finance.cap_rate import calculate_cap_rate, CapRateInput, CapRateResult


class TestCapRateInput:
    """Test CapRateInput validation."""
    
    def test_valid_input_for_cap_rate_calc(self):
        """Test valid input for cap rate calculation."""
        input_data = CapRateInput(
            net_operating_income=Decimal('85000'),
            property_value=Decimal('1000000')
        )
        assert input_data.net_operating_income == Decimal('85000')
        assert input_data.property_value == Decimal('1000000')
        assert input_data.target_cap_rate is None
        
    def test_valid_input_for_value_calc(self):
        """Test valid input for value calculation."""
        input_data = CapRateInput(
            net_operating_income=Decimal('85000'),
            target_cap_rate=Decimal('0.085')
        )
        assert input_data.net_operating_income == Decimal('85000')
        assert input_data.target_cap_rate == Decimal('0.085')
        assert input_data.property_value is None
        
    def test_negative_property_value_rejected(self):
        """Test negative property value is rejected."""
        with pytest.raises(ValueError):
            CapRateInput(
                net_operating_income=Decimal('85000'),
                property_value=Decimal('-1000')
            )
            
    def test_excessive_cap_rate_rejected(self):
        """Test cap rate over 50% is rejected."""
        with pytest.raises(ValueError):
            CapRateInput(
                net_operating_income=Decimal('85000'),
                target_cap_rate=Decimal('0.6')
            )
            
    def test_zero_cap_rate_rejected(self):
        """Test zero cap rate is rejected."""
        with pytest.raises(ValueError):
            CapRateInput(
                net_operating_income=Decimal('85000'),
                target_cap_rate=Decimal('0')
            )
            
    def test_negative_noi_allowed(self):
        """Test negative NOI is allowed for analysis."""
        input_data = CapRateInput(
            net_operating_income=Decimal('-10000'),
            property_value=Decimal('1000000')
        )
        assert input_data.net_operating_income == Decimal('-10000')


class TestCapRateCalculation:
    """Test cap rate calculation logic."""
    
    def test_calculate_cap_rate_from_value(self):
        """Test calculating cap rate from property value."""
        input_data = CapRateInput(
            net_operating_income=Decimal('85000'),
            property_value=Decimal('1000000')
        )
        
        result = calculate_cap_rate(input_data)
        
        assert result.cap_rate == Decimal('0.0850')  # 8.5%
        assert result.implied_value is None
        assert result.cap_rate_quality == "REASONABLE"
        assert not result.negative_noi_warning
        
    def test_calculate_value_from_cap_rate(self):
        """Test calculating property value from cap rate."""
        input_data = CapRateInput(
            net_operating_income=Decimal('85000'),
            target_cap_rate=Decimal('0.085')
        )
        
        result = calculate_cap_rate(input_data)
        
        assert result.cap_rate is None
        assert result.implied_value == Decimal('1000000.00')
        assert result.cap_rate_quality == "CALCULATED_VALUE"
        assert not result.negative_noi_warning
        
    def test_both_inputs_provided_error(self):
        """Test error when both property_value and target_cap_rate provided."""
        with pytest.raises(ValueError, match="Provide either property_value OR target_cap_rate"):
            input_data = CapRateInput(
                net_operating_income=Decimal('85000'),
                property_value=Decimal('1000000'),
                target_cap_rate=Decimal('0.085')
            )
            calculate_cap_rate(input_data)
            
    def test_neither_input_provided_error(self):
        """Test error when neither property_value nor target_cap_rate provided."""
        with pytest.raises(ValueError, match="Must provide either property_value or target_cap_rate"):
            input_data = CapRateInput(net_operating_income=Decimal('85000'))
            calculate_cap_rate(input_data)
            
    def test_zero_property_value_error(self):
        """Test error when property value is zero."""
        input_data = CapRateInput(
            net_operating_income=Decimal('85000'),
            property_value=Decimal('0')
        )
        
        with pytest.raises(ValueError, match="Property value cannot be zero"):
            calculate_cap_rate(input_data)
            
    def test_negative_noi_calculation(self):
        """Test calculation with negative NOI."""
        input_data = CapRateInput(
            net_operating_income=Decimal('-10000'),
            property_value=Decimal('1000000')
        )
        
        result = calculate_cap_rate(input_data)
        
        assert result.cap_rate == Decimal('-0.0100')  # -1%
        assert result.cap_rate_quality == "NEGATIVE_NOI"
        assert result.negative_noi_warning
        
    def test_cap_rate_quality_classification(self):
        """Test cap rate quality classification."""
        test_cases = [
            (Decimal('10000'), Decimal('1000000'), "VERY_LOW"),  # 1%
            (Decimal('30000'), Decimal('1000000'), "LOW"),       # 3%
            (Decimal('80000'), Decimal('1000000'), "REASONABLE"), # 8%
            (Decimal('150000'), Decimal('1000000'), "HIGH"),     # 15%
            (Decimal('250000'), Decimal('1000000'), "VERY_HIGH") # 25%
        ]
        
        for noi, value, expected_quality in test_cases:
            input_data = CapRateInput(
                net_operating_income=noi,
                property_value=value
            )
            result = calculate_cap_rate(input_data)
            assert result.cap_rate_quality == expected_quality
            
    def test_implied_value_with_negative_noi(self):
        """Test implied value calculation with negative NOI."""
        input_data = CapRateInput(
            net_operating_income=Decimal('-10000'),
            target_cap_rate=Decimal('0.08')
        )
        
        result = calculate_cap_rate(input_data)
        
        assert result.implied_value == Decimal('-125000.00')  # Negative value
        assert result.cap_rate_quality == "NEGATIVE_NOI"
        assert result.negative_noi_warning
        
    def test_rounding_precision(self):
        """Test rounding of cap rates and values."""
        input_data = CapRateInput(
            net_operating_income=Decimal('85333.33'),
            property_value=Decimal('999999.99')
        )
        
        result = calculate_cap_rate(input_data)
        
        # Cap rate should be rounded to 4 decimal places
        assert len(str(result.cap_rate).split('.')[-1]) == 4
        
    @given(
        noi=st.decimals(min_value=-100000, max_value=1000000, places=2),
        value=st.decimals(min_value=1, max_value=10000000, places=2)
    )
    def test_property_based_cap_rate(self, noi, value):
        """Property-based test for cap rate calculation."""
        input_data = CapRateInput(
            net_operating_income=noi,
            property_value=value
        )
        
        result = calculate_cap_rate(input_data)
        
        # Basic invariants
        assert result.noi_used == noi.quantize(Decimal('0.01'))
        assert result.cap_rate is not None
        assert result.implied_value is None
        
        # If NOI is negative, warning should be set
        if noi < 0:
            assert result.negative_noi_warning
        else:
            assert not result.negative_noi_warning


class TestCapRateResult:
    """Test CapRateResult model."""
    
    def test_json_serialization(self):
        """Test cap rate result can be serialized to JSON."""
        result = CapRateResult(
            cap_rate=Decimal('0.0850'),
            implied_value=None,
            noi_used=Decimal('85000.00'),
            negative_noi_warning=False,
            cap_rate_quality="REASONABLE"
        )
        
        # Should serialize without errors
        json_data = result.dict()
        
        # Decimals should be preserved
        assert isinstance(json_data['cap_rate'], Decimal)
        assert isinstance(json_data['noi_used'], Decimal)