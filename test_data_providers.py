# LOC_CATEGORY: tests
"""
Unit Tests for CHARLY Data Provider Abstraction Layer
===================================================

Comprehensive test suite ensuring 85%+ coverage and production readiness.

Author: CHARLY Lead AI Software Architect  
Date: June 17, 2025
Version: 1.0.0
"""

import asyncio
import pytest
import aiohttp

    DataProviderError,
    DataSourceType,
    RateLimitConfig,
    SecurityConfig,
    PropertyDataSchema,
    BaseDataProvider,
    ArcGISDataProvider,
    SocrataDataProvider,
    CSVDataProvider,
    PremiumAPIStub,
    DataProviderManager,
    fetch_property_data,
    fetch_property_data_sync
)


class TestPropertyDataSchema:
    """Test cases for PropertyDataSchema Pydantic model."""
    
    def test_valid_property_data(self):
        """Test valid property data creation."""
        data = {
            "parcel_id": "123456789",
            "property_address": "123 Main St, Dallas, TX 75201",
            "county_id": "tx-harris",
            "assessed_value": 450000.0,
            "market_value": 475000.0,
            "assessment_year": 2024
        }
        
        schema = PropertyDataSchema(**data)
        assert schema.parcel_id == "123456789"
        assert schema.assessed_value == 450000.0
        assert schema.assessment_year == 2024
    
    def test_negative_value_validation(self):
        """Test validation of negative financial values."""
        data = {
            "parcel_id": "123456789",
            "property_address": "123 Main St",
            "county_id": "tx-harris",
            "assessed_value": -1000.0  # Invalid negative value
        }
        
        with pytest.raises(ValueError, match="Financial values must be non-negative"):
            PropertyDataSchema(**data)
    
    def test_invalid_assessment_year(self):
        """Test validation of assessment year bounds."""
        data = {
            "parcel_id": "123456789", 
            "property_address": "123 Main St",
            "county_id": "tx-harris",
            "assessment_year": 1850  # Invalid year
        }
        
        with pytest.raises(ValueError, match="Assessment year must be between 1900 and 2030"):
            PropertyDataSchema(**data)
    
    def test_optional_fields(self):
        """Test that optional fields work correctly."""
        minimal_data = {
            "parcel_id": "123456789",
            "property_address": "123 Main St", 
            "county_id": "tx-harris"
        }
        
        schema = PropertyDataSchema(**minimal_data)
        assert schema.assessed_value is None
        assert schema.market_value is None
        assert schema.year_built is None


class TestRateLimitAndSecurityConfig:
    """Test configuration classes."""
    
    def test_rate_limit_config_defaults(self):
        """Test default rate limit configuration."""
        config = RateLimitConfig()
        assert config.requests_per_minute == 60
        assert config.requests_per_hour == 1000
        assert config.max_retries == 3
    
    def test_security_config_defaults(self):
        """Test default security configuration."""
        config = SecurityConfig()
        assert config.timeout_seconds == 30
        assert config.verify_ssl is True
        assert config.max_response_size_mb == 100
        assert "CHARLY" in config.user_agent


class MockDataProvider(BaseDataProvider):
    """Mock implementation for testing base functionality."""
    
    @property
    def data_source_type(self) -> DataSourceType:
        return DataSourceType.REST_API
    
    async def _fetch_raw_data(self, **kwargs) -> dict:
        return {
            "records": [
                {
                    "parcel_id": "TEST123",
                    "property_address": "123 Test St",
                    "assessed_value": 100000
                }
            ]
        }


class TestBaseDataProvider:
    """Test cases for BaseDataProvider abstract class."""
    
    def test_initialization(self):
        """Test provider initialization."""
        provider = MockDataProvider("test-county")
        assert provider.county_id == "test-county"
        assert isinstance(provider.rate_limit_config, RateLimitConfig)
        assert isinstance(provider.security_config, SecurityConfig)
    
    def test_rate_limiting(self):
        """Test rate limiting enforcement."""
        config = RateLimitConfig(requests_per_minute=120)  # 2 per second
        provider = MockDataProvider("test-county", rate_limit_config=config)
        
        import time
        start_time = time.time()
        provider._enforce_rate_limit()
        provider._enforce_rate_limit()  # Should enforce delay
        elapsed = time.time() - start_time
        
        # Should take at least 0.5 seconds for 2 requests at 120/min
        assert elapsed >= 0.4  # Allow some tolerance
    
    def test_response_size_validation(self):
        """Test response size security validation."""
        config = SecurityConfig(max_response_size_mb=1)  # 1MB limit
        provider = MockDataProvider("test-county", security_config=config)
        
        # Test size within limit
        provider._validate_response_size(500000)  # 500KB, should pass
        
        # Test size exceeding limit
        with pytest.raises(DataProviderError, match="Response size.*exceeds maximum"):
            provider._validate_response_size(2000000)  # 2MB, should fail
    
    @pytest.mark.asyncio
    async def test_fetch_data_success(self):
        """Test successful data fetch and standardization."""
        provider = MockDataProvider("test-county")
        
        df = await provider.fetch_data()
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 1
        assert df.iloc[0]['parcel_id'] == "TEST123"
        assert df.iloc[0]['county_id'] == "test-county"
        assert 'data_source' in df.columns
        assert 'last_updated' in df.columns
        assert 'data_quality_score' in df.columns
    
    def test_connection_validation_default(self):
        """Test default connection validation."""
        provider = MockDataProvider("test-county")
        assert provider.validate_connection() is True


class TestArcGISDataProvider:
    """Test cases for ArcGIS REST API provider."""
    
    def test_initialization(self):
        """Test ArcGIS provider initialization."""
        provider = ArcGISDataProvider(
            county_id="tx-harris",
            endpoint_url="https://example.com/arcgis/rest/services/test/MapServer"
        )
        
        assert provider.county_id == "tx-harris"
        assert provider.data_source_type == DataSourceType.ARCGIS_API
        assert "MapServer" in provider.endpoint_url
    
    @pytest.mark.asyncio
    async def test_fetch_raw_data_success(self):
        """Test successful ArcGIS data fetch."""
        provider = ArcGISDataProvider(
            county_id="tx-harris",
            endpoint_url="https://example.com/arcgis/rest/services/test/MapServer"
        )
        
        mock_response_data = {
            "features": [
                {
                    "attributes": {
                        "OBJECTID": 1,
                        "PARCEL_ID": "12345",
                        "ADDRESS": "123 Main St",
                        "ASSESSED_VALUE": 250000
                    }
                },
                {
                    "attributes": {
                        "OBJECTID": 2,
                        "PARCEL_ID": "67890", 
                        "ADDRESS": "456 Oak Ave",
                        "ASSESSED_VALUE": 300000
                    }
                }
            ]
        }
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value.__aenter__.return_value = mock_response
            
            raw_data = await provider._fetch_raw_data()
            
            assert 'records' in raw_data
            assert len(raw_data['records']) == 2
            assert raw_data['records'][0]['PARCEL_ID'] == "12345"
    
    @pytest.mark.asyncio
    async def test_fetch_raw_data_api_error(self):
        """Test ArcGIS API error handling."""
        provider = ArcGISDataProvider(
            county_id="tx-harris",
            endpoint_url="https://example.com/arcgis/rest/services/test/MapServer"
        )
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            # Create a proper ClientResponseError
            request_info = aiohttp.RequestInfo(
                url=URL("https://example.com/test"),
                method="GET",
                headers={},
                real_url=URL("https://example.com/test")
            )
            
            error = aiohttp.ClientResponseError(
                request_info=request_info, 
                history=(), 
                status=404,
                message="Not Found"
            )
            
            mock_response = MagicMock()
            # The raise_for_status method should raise immediately, not return a coroutine
            mock_response.raise_for_status.side_effect = error
            # json() should be async
            mock_response.json = AsyncMock(return_value={})
            mock_get.return_value.__aenter__.return_value = mock_response
            
            with pytest.raises(DataProviderError, match="ArcGIS API request failed"):
                await provider._fetch_raw_data()
    
    def test_connection_validation(self):
        """Test ArcGIS connection validation."""
        provider = ArcGISDataProvider(
            county_id="tx-harris",
            endpoint_url="https://example.com/arcgis/rest/services/test/MapServer"
        )
        
        with patch('requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response
            
            assert provider.validate_connection() is True
            
            # Test connection failure
            mock_response.status_code = 404
            assert provider.validate_connection() is False


class TestSocrataDataProvider:
    """Test cases for Socrata API provider."""
    
    def test_initialization(self):
        """Test Socrata provider initialization."""
        provider = SocrataDataProvider(
            county_id="wa-king",
            domain="data.kingcounty.gov",
            dataset_id="abc123"
        )
        
        assert provider.county_id == "wa-king"
        assert provider.data_source_type == DataSourceType.SOCRATA_API
        assert provider.domain == "data.kingcounty.gov"
        assert "abc123" in provider.base_url
    
    @pytest.mark.asyncio
    async def test_fetch_raw_data_with_api_key(self):
        """Test Socrata data fetch with API key."""
        security_config = SecurityConfig(api_key="test-api-key")
        provider = SocrataDataProvider(
            county_id="wa-king",
            domain="data.kingcounty.gov", 
            dataset_id="abc123",
            security_config=security_config
        )
        
        mock_response_data = [
            {"id": "1", "address": "123 Main St", "value": 100000},
            {"id": "2", "address": "456 Oak Ave", "value": 150000}
        ]
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value.__aenter__.return_value = mock_response
            
            raw_data = await provider._fetch_raw_data(limit=500, where="value > 50000")
            
            assert 'records' in raw_data
            assert len(raw_data['records']) == 2
            
            # Verify API key was included in headers
            call_args = mock_get.call_args
            headers = call_args[1]['headers']
            assert headers['X-App-Token'] == "test-api-key"


class TestCSVDataProvider:
    """Test cases for CSV download provider."""
    
    def test_initialization(self):
        """Test CSV provider initialization."""
        provider = CSVDataProvider(
            county_id="ca-los-angeles",
            csv_url="https://example.com/data.csv"
        )
        
        assert provider.county_id == "ca-los-angeles"
        assert provider.data_source_type == DataSourceType.CSV_DOWNLOAD
        assert provider.csv_url == "https://example.com/data.csv"
    
    @pytest.mark.asyncio
    async def test_fetch_raw_data_success(self):
        """Test successful CSV data fetch."""
        provider = CSVDataProvider(
            county_id="ca-los-angeles",
            csv_url="https://example.com/data.csv"
        )
        
        mock_csv_content = """parcel_id,address,assessed_value
123,123 Main St,100000
456,456 Oak Ave,150000"""
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text.return_value = mock_csv_content
            mock_response.raise_for_status.return_value = None
            mock_get.return_value.__aenter__.return_value = mock_response
            
            raw_data = await provider._fetch_raw_data()
            
            assert 'records' in raw_data
            assert len(raw_data['records']) == 2
            assert raw_data['records'][0]['parcel_id'] == 123  # pandas converts to int
            assert raw_data['records'][1]['assessed_value'] == 150000
    
    @pytest.mark.asyncio
    async def test_fetch_raw_data_size_limit(self):
        """Test CSV download size limit enforcement."""
        security_config = SecurityConfig(max_response_size_mb=0.001)  # Very small limit
        provider = CSVDataProvider(
            county_id="ca-los-angeles",
            csv_url="https://example.com/data.csv",
            security_config=security_config
        )
        
        # Create large CSV content that exceeds limit
        large_csv = "parcel_id,address\n" + ("123,123 Main St\n" * 1000)
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.text.return_value = large_csv
            mock_response.raise_for_status.return_value = None
            mock_get.return_value.__aenter__.return_value = mock_response
            
            with pytest.raises(DataProviderError, match="Response size.*exceeds maximum"):
                await provider._fetch_raw_data()


class TestPremiumAPIStub:
    """Test cases for premium API stub."""
    
    def test_initialization(self):
        """Test premium stub initialization."""
        provider = PremiumAPIStub(
            county_id="test-county",
            provider_name="ATTOM Data"
        )
        
        assert provider.county_id == "test-county"
        assert provider.data_source_type == DataSourceType.PREMIUM_API
        assert provider.provider_name == "ATTOM Data"
    
    @pytest.mark.asyncio
    async def test_fetch_raw_data_stub(self):
        """Test premium stub returns empty data."""
        provider = PremiumAPIStub(
            county_id="test-county",
            provider_name="ATTOM Data"
        )
        
        raw_data = await provider._fetch_raw_data()
        assert raw_data == {'records': []}
    
    def test_connection_validation_stub(self):
        """Test premium stub connection validation."""
        provider = PremiumAPIStub(
            county_id="test-county",
            provider_name="ATTOM Data"
        )
        
        assert provider.validate_connection() is False


class TestDataProviderManager:
    """Test cases for DataProviderManager."""
    
    def test_initialization(self):
        """Test manager initialization."""
        manager = DataProviderManager()
        assert len(manager._county_configs) == 8  # 8 pilot counties
        assert "tx-harris" in manager._county_configs
        assert "ca-los-angeles" in manager._county_configs
    
    def test_get_provider_success(self):
        """Test successful provider creation."""
        manager = DataProviderManager()
        
        provider = manager.get_provider("tx-harris")
        assert isinstance(provider, ArcGISDataProvider)
        assert provider.county_id == "tx-harris"
        
        # Test provider caching
        provider2 = manager.get_provider("tx-harris") 
        assert provider is provider2  # Same instance
    
    def test_get_provider_unsupported_county(self):
        """Test error for unsupported county."""
        manager = DataProviderManager()
        
        with pytest.raises(DataProviderError, match="County.*not supported"):
            manager.get_provider("invalid-county")
    
    def test_list_supported_counties(self):
        """Test listing supported counties."""
        manager = DataProviderManager()
        counties = manager.list_supported_counties()
        
        assert len(counties) == 8
        assert "tx-harris" in counties
        assert "ca-los-angeles" in counties
        assert "wa-king" in counties
    
    def test_validate_all_connections(self):
        """Test connection validation for all counties."""
        manager = DataProviderManager()
        
        # Mock the validate_connection method for all provider types
        with patch.object(ArcGISDataProvider, 'validate_connection', return_value=True), \
             patch.object(SocrataDataProvider, 'validate_connection', return_value=True), \
             patch.object(CSVDataProvider, 'validate_connection', return_value=True), \
             patch.object(PremiumAPIStub, 'validate_connection', return_value=True):
            
            results = manager.validate_all_connections()
            
            assert len(results) == 8
            assert all(status is True for status in results.values())


class TestMainInterface:
    """Test cases for main interface functions."""
    
    @pytest.mark.asyncio
    async def test_fetch_property_data_success(self):
        """Test successful property data fetch."""
        mock_df = pd.DataFrame([
            {"parcel_id": "123", "county_id": "tx-harris", "assessed_value": 100000}
        ])
        
        with patch.object(DataProviderManager, 'get_provider') as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.fetch_data.return_value = mock_df
            mock_get_provider.return_value = mock_provider
            
            result = await fetch_property_data("tx-harris", max_records=10)
            
            assert isinstance(result, pd.DataFrame)
            assert len(result) == 1
            assert result.iloc[0]['parcel_id'] == "123"
    
    @pytest.mark.asyncio
    async def test_fetch_property_data_error(self):
        """Test error handling in fetch_property_data."""
        with patch.object(DataProviderManager, 'get_provider') as mock_get_provider:
            mock_get_provider.side_effect = Exception("Test error")
            
            with pytest.raises(DataProviderError, match="Unexpected error fetching data"):
                await fetch_property_data("tx-harris")
    
    def test_fetch_property_data_sync(self):
        """Test synchronous wrapper function."""
        mock_df = pd.DataFrame([{"parcel_id": "123", "county_id": "tx-harris"}])
        
        with patch('data_providers.fetch_property_data') as mock_async_fetch:
            mock_async_fetch.return_value = mock_df
            
            with patch('asyncio.run') as mock_run:
                mock_run.return_value = mock_df
                
                result = fetch_property_data_sync("tx-harris")
                
                assert isinstance(result, pd.DataFrame)
                mock_run.assert_called_once()


class TestDataProviderError:
    """Test cases for custom exception class."""
    
    def test_basic_error(self):
        """Test basic error creation."""
        error = DataProviderError("Test message")
        assert str(error) == "Test message"
        assert error.county_id is None
        assert error.error_code is None
    
    def test_error_with_details(self):
        """Test error with county and error code."""
        error = DataProviderError(
            "Test message",
            county_id="tx-harris", 
            error_code="API_ERROR"
        )
        
        assert error.message == "Test message"
        assert error.county_id == "tx-harris"
        assert error.error_code == "API_ERROR"


# Performance and Integration Tests
class TestPerformanceAndIntegration:
    """Performance and integration test cases."""
    
    @pytest.mark.asyncio
    async def test_concurrent_data_fetch(self):
        """Test concurrent data fetching from multiple counties."""
        mock_df = pd.DataFrame([{"parcel_id": "123", "county_id": "test"}])
        
        with patch.object(DataProviderManager, 'get_provider') as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.fetch_data.return_value = mock_df
            mock_get_provider.return_value = mock_provider
            
            # Test concurrent fetching
            counties = ["tx-harris", "ca-los-angeles", "wa-king"]
            tasks = [fetch_property_data(county_id) for county_id in counties]
            results = await asyncio.gather(*tasks)
            
            assert len(results) == 3
            assert all(isinstance(df, pd.DataFrame) for df in results)
    
    def test_memory_usage_large_dataset(self):
        """Test memory efficiency with large datasets."""
        # Create mock large dataset
        large_records = [
            {"parcel_id": f"ID{i}", "assessed_value": i * 1000}
            for i in range(10000)
        ]
        
        provider = MockDataProvider("test-county")
        
        # Override _fetch_raw_data to return large dataset
        async def mock_fetch():
            return {"records": large_records}
        
        provider._fetch_raw_data = mock_fetch
        
        # This test mainly ensures no memory errors occur
        import asyncio
        df = asyncio.run(provider.fetch_data())
        assert len(df) == 10000
        assert 'data_quality_score' in df.columns


if __name__ == "__main__":
    # Run tests with coverage reporting
    pytest.main([
        __file__,
        "-v",
        "--cov=data_providers",
        "--cov-report=html",
        "--cov-report=term-missing",
        "--cov-fail-under=85"
    ])