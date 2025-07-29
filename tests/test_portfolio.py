"""
Unit tests for CHARLY portfolio management system.
Tests portfolio service, valuation service, and API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import the modules to test
from fastapi_backend.models.portfolio import (
    PropertyRecord, 
    PropertyCreateRequest, 
    PropertyType,
    PropertyStatus
)
from fastapi_backend.services.portfolio_service import PortfolioService
from fastapi_backend.services.valuation_service import ValuationService
from fastapi_backend.routes.portfolio_router import router
from fastapi_backend.validators.portfolio_validator import PortfolioValidator


# Test fixtures
@pytest.fixture
def portfolio_service():
    """Create a fresh portfolio service for each test."""
    return PortfolioService()


@pytest.fixture
def valuation_service():
    """Create a valuation service for testing."""
    return ValuationService()


@pytest.fixture
def sample_property_data():
    """Sample property data for testing."""
    return PropertyCreateRequest(
        address="123 Test St, Austin, TX 78701",
        property_type=PropertyType.COMMERCIAL,
        current_assessment=500000.0,
        city="Austin",
        state="TX",
        zip_code="78701",
        county="Travis County",
        square_footage=20000.0,
        year_built=2000,
        market_value=480000.0,
        annual_income=60000.0,
        annual_expenses=20000.0
    )


@pytest.fixture
def test_client():
    """Create a test client for API testing."""
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


# Portfolio Service Tests
class TestPortfolioService:
    """Test portfolio service functionality."""
    
    def test_create_property(self, portfolio_service, sample_property_data):
        """Test property creation."""
        property_record = portfolio_service.create_property(sample_property_data)
        
        assert property_record.id is not None
        assert property_record.address == sample_property_data.address
        assert property_record.property_type == sample_property_data.property_type
        assert property_record.current_assessment == sample_property_data.current_assessment
        assert property_record.status == PropertyStatus.UNDER_REVIEW
    
    def test_get_property_by_id(self, portfolio_service, sample_property_data):
        """Test property retrieval by ID."""
        # Create a property first
        created_property = portfolio_service.create_property(sample_property_data)
        
        # Retrieve it
        retrieved_property = portfolio_service.get_property_by_id(created_property.id)
        
        assert retrieved_property is not None
        assert retrieved_property.id == created_property.id
        assert retrieved_property.address == created_property.address
    
    def test_get_nonexistent_property(self, portfolio_service):
        """Test retrieval of non-existent property."""
        result = portfolio_service.get_property_by_id("nonexistent_id")
        assert result is None
    
    def test_get_all_properties(self, portfolio_service):
        """Test getting all properties (should include sample data)."""
        properties = portfolio_service.get_all_properties()
        
        # Portfolio service initializes with 3 sample properties
        assert len(properties) >= 3
        assert all(isinstance(prop, PropertyRecord) for prop in properties)
    
    def test_get_portfolio_summary(self, portfolio_service):
        """Test portfolio summary generation."""
        summary = portfolio_service.get_portfolio_summary()
        
        assert summary.total_properties >= 3  # At least the sample data
        assert summary.total_assessment > 0
        assert summary.total_potential_savings >= 0
        assert isinstance(summary.by_type, dict)
    
    def test_search_properties(self, portfolio_service):
        """Test property search functionality."""
        # Search for Austin (should find sample data)
        results = portfolio_service.search_properties("Austin")
        
        assert len(results) >= 1
        assert any("Austin" in prop.address for prop in results)
    
    def test_delete_property(self, portfolio_service, sample_property_data):
        """Test property deletion."""
        # Create a property
        property_record = portfolio_service.create_property(sample_property_data)
        
        # Delete it
        success = portfolio_service.delete_property(property_record.id)
        assert success is True
        
        # Verify it's gone
        retrieved = portfolio_service.get_property_by_id(property_record.id)
        assert retrieved is None
    
    def test_bulk_update_status(self, portfolio_service):
        """Test bulk status updates."""
        # Get existing property IDs
        properties = portfolio_service.get_all_properties(limit=2)
        property_ids = [prop.id for prop in properties]
        
        # Update their status
        updated_count = portfolio_service.bulk_update_status(
            property_ids, 
            PropertyStatus.APPEAL_FILED
        )
        
        assert updated_count == len(property_ids)
        
        # Verify the updates
        for prop_id in property_ids:
            prop = portfolio_service.get_property_by_id(prop_id)
            assert prop.status == PropertyStatus.APPEAL_FILED


# Valuation Service Tests
class TestValuationService:
    """Test valuation service calculations."""
    
    def test_calculate_noi(self, valuation_service):
        """Test NOI calculation."""
        noi = valuation_service.calculate_noi(
            annual_income=100000.0,
            annual_expenses=30000.0,
            vacancy_rate=0.05
        )
        
        # NOI = (100000 * 0.95) - 30000 = 65000
        assert noi == 65000.0
    
    def test_calculate_noi_with_default_vacancy(self, valuation_service):
        """Test NOI calculation with default vacancy rate."""
        noi = valuation_service.calculate_noi(
            annual_income=100000.0,
            annual_expenses=30000.0
        )
        
        # NOI = (100000 * 0.95) - 30000 = 65000 (default 5% vacancy)
        assert noi == 65000.0
    
    def test_calculate_noi_insufficient_data(self, valuation_service):
        """Test NOI calculation with insufficient data."""
        noi = valuation_service.calculate_noi(
            annual_income=None,
            annual_expenses=30000.0
        )
        
        assert noi is None
    
    def test_calculate_cap_rate(self, valuation_service):
        """Test cap rate calculation."""
        cap_rate = valuation_service.calculate_cap_rate(
            noi=50000.0,
            property_value=1000000.0
        )
        
        # Cap Rate = 50000 / 1000000 = 0.05 (5%)
        assert cap_rate == 0.05
    
    def test_calculate_cap_rate_zero_value(self, valuation_service):
        """Test cap rate calculation with zero property value."""
        cap_rate = valuation_service.calculate_cap_rate(
            noi=50000.0,
            property_value=0.0
        )
        
        assert cap_rate is None
    
    def test_calculate_expense_ratio(self, valuation_service):
        """Test expense ratio calculation."""
        expense_ratio = valuation_service.calculate_expense_ratio(
            annual_expenses=30000.0,
            annual_income=100000.0
        )
        
        # Expense Ratio = 30000 / 100000 = 0.30 (30%)
        assert expense_ratio == 0.30
    
    def test_perform_valuation(self, valuation_service):
        """Test complete valuation analysis."""
        # Create a test property
        property_record = PropertyRecord(
            id="test_001",
            address="123 Test St",
            property_type=PropertyType.COMMERCIAL,
            current_assessment=500000.0,
            market_value=480000.0,
            annual_income=60000.0,
            annual_expenses=20000.0,
            vacancy_rate=0.05
        )
        
        result = valuation_service.perform_valuation(property_record)
        
        # Verify calculations
        assert result.property_id == "test_001"
        assert result.noi == 37000.0  # (60000 * 0.95) - 20000
        assert result.cap_rate == 0.074  # 37000 / 500000
        assert result.expense_ratio == 0.333333333333333  # 20000 / 60000 (approximately)
        assert 0 <= result.valuation_score <= 100
        assert isinstance(result.flags, list)
    
    def test_valuation_score_calculation(self, valuation_service):
        """Test valuation score calculation logic."""
        # Create property with over-assessment
        property_record = PropertyRecord(
            id="test_002",
            address="456 Test Ave",
            property_type=PropertyType.COMMERCIAL,
            current_assessment=600000.0,
            market_value=500000.0,  # Over-assessed
            annual_income=50000.0,
            annual_expenses=15000.0,
            vacancy_rate=0.05
        )
        
        score, flags = valuation_service.calculate_valuation_score(property_record)
        
        assert 0 <= score <= 100
        assert "potentially_over_assessed" in flags or "significantly_over_assessed" in flags


# Validator Tests
class TestPortfolioValidator:
    """Test portfolio validation functionality."""
    
    def test_validate_address_valid(self):
        """Test address validation with valid address."""
        errors = PortfolioValidator.validate_address("123 Main St, Austin, TX 78701")
        assert len(errors) == 0
    
    def test_validate_address_too_short(self):
        """Test address validation with too short address."""
        errors = PortfolioValidator.validate_address("123")
        assert len(errors) > 0
        assert "at least 5 characters" in errors[0]
    
    def test_validate_zip_code_valid(self):
        """Test ZIP code validation with valid codes."""
        errors = PortfolioValidator.validate_zip_code("78701")
        assert len(errors) == 0
        
        errors = PortfolioValidator.validate_zip_code("78701-1234")
        assert len(errors) == 0
    
    def test_validate_zip_code_invalid(self):
        """Test ZIP code validation with invalid format."""
        errors = PortfolioValidator.validate_zip_code("1234")
        assert len(errors) > 0
        
        errors = PortfolioValidator.validate_zip_code("abcde")
        assert len(errors) > 0
    
    def test_validate_financial_data_valid(self):
        """Test financial data validation with valid data."""
        errors = PortfolioValidator.validate_financial_data(
            current_assessment=500000.0,
            market_value=480000.0,
            annual_income=60000.0,
            annual_expenses=20000.0,
            proposed_value=450000.0
        )
        assert len(errors) == 0
    
    def test_validate_financial_data_expenses_exceed_income(self):
        """Test financial data validation with expenses exceeding income."""
        errors = PortfolioValidator.validate_financial_data(
            current_assessment=500000.0,
            annual_income=30000.0,
            annual_expenses=50000.0  # Exceeds income
        )
        assert len(errors) > 0
        assert "cannot exceed" in str(errors)


# API Endpoint Tests
class TestPortfolioAPI:
    """Test portfolio API endpoints."""
    
    def test_get_properties_endpoint(self, test_client):
        """Test GET /api/portfolio/ endpoint."""
        response = test_client.get("/api/portfolio/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Should have sample data
    
    def test_get_portfolio_summary_endpoint(self, test_client):
        """Test GET /api/portfolio/summary endpoint."""
        response = test_client.get("/api/portfolio/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_properties" in data
        assert "total_assessment" in data
        assert "total_potential_savings" in data
    
    def test_search_properties_endpoint(self, test_client):
        """Test GET /api/portfolio/search endpoint."""
        response = test_client.get("/api/portfolio/search?q=Austin")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_property_endpoint(self, test_client, sample_property_data):
        """Test POST /api/portfolio/ endpoint."""
        response = test_client.post(
            "/api/portfolio/",
            json=sample_property_data.dict()
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["address"] == sample_property_data.address
        assert "id" in data
    
    def test_get_property_valuation_endpoint(self, test_client):
        """Test GET /api/portfolio/valuation/{property_id} endpoint."""
        # First get a property ID
        properties_response = test_client.get("/api/portfolio/")
        properties = properties_response.json()
        
        if properties:
            property_id = properties[0]["id"]
            response = test_client.get(f"/api/portfolio/valuation/{property_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert "property_id" in data
            assert "valuation_score" in data
    
    def test_portfolio_health_check(self, test_client):
        """Test portfolio health check endpoint."""
        response = test_client.get("/api/portfolio/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "portfolio"


# Integration Tests
class TestPortfolioIntegration:
    """Test integration between portfolio and valuation services."""
    
    def test_create_and_value_property(self, portfolio_service, valuation_service, sample_property_data):
        """Test creating a property and performing valuation."""
        # Create property
        property_record = portfolio_service.create_property(sample_property_data)
        
        # Perform valuation
        valuation_result = valuation_service.perform_valuation(property_record)
        
        # Verify integration
        assert valuation_result.property_id == property_record.id
        assert property_record.noi is not None
        assert property_record.valuation_score is not None
        assert len(property_record.flags) > 0


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])