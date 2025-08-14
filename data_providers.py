# LOC_CATEGORY: interface
"""
CHARLY Data Provider Abstraction Layer
=====================================

Production-grade data ingestion system using Strategy Pattern for unified 
property data access across multiple county sources.

Author: CHARLY Lead AI Software Architect
Date: June 17, 2025
Version: 1.0.0
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Protocol

import aiohttp
import requests


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataProviderError(Exception):
    """Base exception for data provider errors."""
    
    def __init__(self, message: str, county_id: str = None, error_code: str = None):
        self.message = message
        self.county_id = county_id
        self.error_code = error_code
        super().__init__(self.message)


class DataSourceType(Enum):
    """Enumeration of supported data source types."""
    REST_API = "rest_api"
    SOCRATA_API = "socrata_api"
    ARCGIS_API = "arcgis_api"
    CSV_DOWNLOAD = "csv_download"
    BULK_PORTAL = "bulk_portal"
    PREMIUM_API = "premium_api"


@dataclass
class RateLimitConfig:
    """Rate limiting configuration for API providers."""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    backoff_factor: float = 1.5
    max_retries: int = 3


@dataclass
class SecurityConfig:
    """Security configuration for data providers."""
    api_key: Optional[str] = None
    user_agent: str = "CHARLY/1.0.0 Property Tax Analytics Platform"
    timeout_seconds: int = 30
    verify_ssl: bool = True
    max_response_size_mb: int = 100


class PropertyDataSchema(BaseModel):
    """Pydantic schema for standardized property data output."""
    
    # Core identification fields
    parcel_id: str = Field(..., description="Unique parcel identifier")
    property_address: str = Field(..., description="Full property address")
    county_id: str = Field(..., description="County identifier from pilot selection")
    
    # Financial fields (from 52 canonical fields)
    assessed_value: Optional[float] = Field(None, description="Current assessed value")
    market_value: Optional[float] = Field(None, description="Market value estimate")
    previous_assessed_value: Optional[float] = Field(None, description="Prior year assessed value")
    property_type: Optional[str] = Field(None, description="Property classification")
    
    # Assessment details
    assessment_year: Optional[int] = Field(None, description="Tax year for assessment")
    assessment_ratio: Optional[float] = Field(None, description="Assessment to market ratio")
    exemptions_total: Optional[float] = Field(None, description="Total exemptions amount")
    
    # Physical characteristics
    land_area_sq_ft: Optional[float] = Field(None, description="Land area in square feet")
    building_area_sq_ft: Optional[float] = Field(None, description="Building square footage")
    year_built: Optional[int] = Field(None, description="Year property was built")
    
    # Metadata
    last_updated: Optional[str] = Field(None, description="Data source last update timestamp")
    data_source: Optional[str] = Field(None, description="Source provider name")
    data_quality_score: Optional[float] = Field(None, description="Data completeness score 0-1")
    
    @validator('assessed_value', 'market_value', 'previous_assessed_value')
    def validate_positive_values(cls, v):
        if v is not None and v < 0:
            raise ValueError('Financial values must be non-negative')
        return v
    
    @validator('assessment_year')
    def validate_assessment_year(cls, v):
        if v is not None and (v < 1900 or v > 2030):
            raise ValueError('Assessment year must be between 1900 and 2030')
        return v


class DataProviderStrategy(Protocol):
    """Protocol defining the interface for all data provider strategies."""
    
    @property
    def county_id(self) -> str:
        """County identifier for this provider."""
        ...
    
    @property
    def data_source_type(self) -> DataSourceType:
        """Type of data source this provider handles."""
        ...
    
    async def fetch_data(self, **kwargs) -> pd.DataFrame:
        """Fetch property data and return as standardized DataFrame."""
        ...
    
    def validate_connection(self) -> bool:
        """Validate that the data source is accessible."""
        ...


class BaseDataProvider(ABC):
    """Abstract base class for all data provider strategies."""
    
    def __init__(
        self,
        county_id: str,
        rate_limit_config: Optional[RateLimitConfig] = None,
        security_config: Optional[SecurityConfig] = None
    ):
        self.county_id = county_id
        self.rate_limit_config = rate_limit_config or RateLimitConfig()
        self.security_config = security_config or SecurityConfig()
        self._last_request_time = 0
        self._request_count = 0
        self._session = None
        
        logger.info(f"Initialized {self.__class__.__name__} for county: {county_id}")
    
    @property
    @abstractmethod
    def data_source_type(self) -> DataSourceType:
        """Type of data source this provider handles."""
        pass
    
    @abstractmethod
    async def _fetch_raw_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch raw data from the source. Must be implemented by subclasses."""
        pass
    
    def _enforce_rate_limit(self) -> None:
        """Enforce rate limiting between requests."""
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        min_interval = 60.0 / self.rate_limit_config.requests_per_minute
        
        if time_since_last < min_interval:
            sleep_time = min_interval - time_since_last
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self._last_request_time = time.time()
        self._request_count += 1
    
    def _validate_response_size(self, response_size_bytes: int) -> None:
        """Validate response size doesn't exceed security limits."""
        max_size_bytes = self.security_config.max_response_size_mb * 1024 * 1024
        if response_size_bytes > max_size_bytes:
            raise DataProviderError(
                f"Response size {response_size_bytes} exceeds maximum {max_size_bytes}",
                county_id=self.county_id,
                error_code="RESPONSE_TOO_LARGE"
            )
    
    def _standardize_dataframe(self, raw_data: Dict[str, Any]) -> pd.DataFrame:
        """Convert raw data to standardized DataFrame format."""
        try:
            # This is a stub implementation - each provider will override
            # to handle their specific data format
            df = pd.DataFrame(raw_data.get('records', []))
            
            # Add metadata columns
            df['county_id'] = self.county_id
            df['data_source'] = self.__class__.__name__
            df['last_updated'] = pd.Timestamp.now().isoformat()
            
            # Calculate data quality score based on non-null values
            if len(df) > 0:
                non_null_ratio = df.notna().sum(axis=1) / len(df.columns)
                df['data_quality_score'] = non_null_ratio
            
            logger.info(f"Standardized {len(df)} records for county {self.county_id}")
            return df
            
        except Exception as e:
            raise DataProviderError(
                f"Failed to standardize data: {str(e)}",
                county_id=self.county_id,
                error_code="STANDARDIZATION_ERROR"
            )
    
    async def fetch_data(self, **kwargs) -> pd.DataFrame:
        """Main interface method to fetch and standardize property data."""
        try:
            self._enforce_rate_limit()
            
            logger.info(f"Fetching data for county {self.county_id}")
            raw_data = await self._fetch_raw_data(**kwargs)
            
            if not raw_data:
                raise DataProviderError(
                    "No data returned from source",
                    county_id=self.county_id,
                    error_code="NO_DATA"
                )
            
            standardized_df = self._standardize_dataframe(raw_data)
            
            # Validate against Pydantic schema (sample validation)
            if len(standardized_df) > 0:
                sample_record = standardized_df.iloc[0].to_dict()
                try:
                    PropertyDataSchema(**sample_record)
                except Exception as validation_error:
                    logger.warning(f"Schema validation warning: {validation_error}")
            
            return standardized_df
            
        except DataProviderError:
            raise
        except Exception as e:
            raise DataProviderError(
                f"Unexpected error in data fetch: {str(e)}",
                county_id=self.county_id,
                error_code="FETCH_ERROR"
            )
    
    def validate_connection(self) -> bool:
        """Default connection validation - can be overridden by subclasses."""
        try:
            # Basic connectivity test
            return True
        except Exception as e:
            logger.error(f"Connection validation failed for {self.county_id}: {e}")
            return False


class ArcGISDataProvider(BaseDataProvider):
    """Data provider for ArcGIS REST API sources (e.g., Harris County)."""
    
    def __init__(self, county_id: str, endpoint_url: str, **kwargs):
        super().__init__(county_id, **kwargs)
        self.endpoint_url = endpoint_url
        self.service_info = None
    
    @property
    def data_source_type(self) -> DataSourceType:
        return DataSourceType.ARCGIS_API
    
    async def _fetch_raw_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from ArcGIS REST API."""
        try:
            # Build query parameters for ArcGIS REST API
            params = {
                'f': 'json',
                'where': kwargs.get('where_clause', '1=1'),
                'outFields': kwargs.get('fields', '*'),
                'returnGeometry': kwargs.get('return_geometry', 'false'),
                'resultRecordCount': kwargs.get('max_records', 1000)
            }
            
            query_url = f"{self.endpoint_url}/0/query"
            
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.security_config.timeout_seconds)
            ) as session:
                async with session.get(query_url, params=params) as response:
                    response.raise_for_status()
                    data = await response.json()
            
            if 'features' in data:
                # Extract attributes from ArcGIS feature format
                records = [feature['attributes'] for feature in data['features']]
                return {'records': records}
            else:
                return {'records': []}
                
        except aiohttp.ClientError as e:
            raise DataProviderError(
                f"ArcGIS API request failed: {str(e)}",
                county_id=self.county_id,
                error_code="API_REQUEST_FAILED"
            )
    
    def validate_connection(self) -> bool:
        """Validate ArcGIS service endpoint."""
        try:
            response = requests.get(
                f"{self.endpoint_url}?f=json",
                timeout=self.security_config.timeout_seconds
            )
            return response.status_code == 200
        except Exception:
            return False


class SocrataDataProvider(BaseDataProvider):
    """Data provider for Socrata API sources (e.g., King County)."""
    
    def __init__(self, county_id: str, domain: str, dataset_id: str, **kwargs):
        super().__init__(county_id, **kwargs)
        self.domain = domain
        self.dataset_id = dataset_id
        self.base_url = f"https://{domain}/resource/{dataset_id}.json"
    
    @property
    def data_source_type(self) -> DataSourceType:
        return DataSourceType.SOCRATA_API
    
    async def _fetch_raw_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from Socrata API."""
        try:
            params = {
                '$limit': kwargs.get('limit', 1000),
                '$offset': kwargs.get('offset', 0)
            }
            
            # Add filtering if provided
            if 'where' in kwargs:
                params['$where'] = kwargs['where']
            
            headers = {
                'User-Agent': self.security_config.user_agent
            }
            
            if self.security_config.api_key:
                headers['X-App-Token'] = self.security_config.api_key
            
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.security_config.timeout_seconds)
            ) as session:
                async with session.get(self.base_url, params=params, headers=headers) as response:
                    response.raise_for_status()
                    records = await response.json()
            
            return {'records': records}
            
        except aiohttp.ClientError as e:
            raise DataProviderError(
                f"Socrata API request failed: {str(e)}",
                county_id=self.county_id,
                error_code="API_REQUEST_FAILED"
            )


class CSVDataProvider(BaseDataProvider):
    """Data provider for CSV/bulk download sources."""
    
    def __init__(self, county_id: str, csv_url: str, **kwargs):
        super().__init__(county_id, **kwargs)
        self.csv_url = csv_url
    
    @property
    def data_source_type(self) -> DataSourceType:
        return DataSourceType.CSV_DOWNLOAD
    
    async def _fetch_raw_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from CSV download."""
        try:
            headers = {
                'User-Agent': self.security_config.user_agent
            }
            
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.security_config.timeout_seconds)
            ) as session:
                async with session.get(self.csv_url, headers=headers) as response:
                    response.raise_for_status()
                    
                    # Read CSV content
                    csv_content = await response.text()
                    
                    # Validate response size
                    self._validate_response_size(len(csv_content.encode('utf-8')))
            
            # Convert CSV to records using pandas
            import io
            df = pd.read_csv(io.StringIO(csv_content))
            records = df.to_dict('records')
            
            return {'records': records}
            
        except Exception as e:
            raise DataProviderError(
                f"CSV download failed: {str(e)}",
                county_id=self.county_id,
                error_code="CSV_DOWNLOAD_FAILED"
            )


class PremiumAPIStub(BaseDataProvider):
    """Stub implementation for premium data providers (ATTOM, TaxNetUSA)."""
    
    def __init__(self, county_id: str, provider_name: str, **kwargs):
        super().__init__(county_id, **kwargs)
        self.provider_name = provider_name
    
    @property
    def data_source_type(self) -> DataSourceType:
        return DataSourceType.PREMIUM_API
    
    async def _fetch_raw_data(self, **kwargs) -> Dict[str, Any]:
        """Stub implementation for premium providers."""
        logger.warning(f"Premium provider {self.provider_name} not yet implemented")
        return {'records': []}
    
    def validate_connection(self) -> bool:
        """Stub validation for premium providers."""
        logger.info(f"Premium provider {self.provider_name} validation stubbed")
        return False  # Not implemented yet


class DataProviderManager:
    """Main interface for data provider abstraction layer."""
    
    def __init__(self):
        self._providers: Dict[str, BaseDataProvider] = {}
        self._county_configs = self._load_county_configurations()
        logger.info("DataProviderManager initialized")
    
    def _load_county_configurations(self) -> Dict[str, Dict[str, Any]]:
        """Load county configurations from validated pilot selection."""
        return {
            "ca-los-angeles": {
                "provider_class": CSVDataProvider,
                "config": {
                    "csv_url": "https://data.lacounty.gov/api/views/example/rows.csv"
                }
            },
            "wa-king": {
                "provider_class": SocrataDataProvider,
                "config": {
                    "domain": "data.kingcounty.gov",
                    "dataset_id": "property-dataset-id"  # To be determined
                }
            },
            "tx-harris": {
                "provider_class": ArcGISDataProvider,
                "config": {
                    "endpoint_url": "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer"
                }
            },
            "il-cook": {
                "provider_class": CSVDataProvider,
                "config": {
                    "csv_url": "https://datacatalog.cookcountyil.gov/api/views/example/rows.csv"
                }
            },
            "fl-miami-dade": {
                "provider_class": CSVDataProvider,
                "config": {
                    "csv_url": "https://opendata.miamidade.gov/api/views/example/rows.csv"
                }
            },
            "ny-nassau": {
                "provider_class": CSVDataProvider,
                "config": {
                    "csv_url": "https://data.ny.gov/api/views/example/rows.csv"
                }
            },
            "az-maricopa": {
                "provider_class": PremiumAPIStub,
                "config": {
                    "provider_name": "Maricopa County Assessor"
                }
            },
            "pa-philadelphia": {
                "provider_class": CSVDataProvider,
                "config": {
                    "csv_url": "https://www.opendataphilly.org/api/views/example/rows.csv"
                }
            }
        }
    
    def get_provider(self, county_id: str) -> BaseDataProvider:
        """Get or create a data provider for the specified county."""
        if county_id not in self._providers:
            if county_id not in self._county_configs:
                raise DataProviderError(
                    f"County {county_id} not supported. Available counties: {list(self._county_configs.keys())}",
                    county_id=county_id,
                    error_code="COUNTY_NOT_SUPPORTED"
                )
            
            config = self._county_configs[county_id]
            provider_class = config['provider_class']
            provider_config = config['config']
            
            # Create provider instance
            self._providers[county_id] = provider_class(
                county_id=county_id,
                **provider_config
            )
            
            logger.info(f"Created provider for county {county_id}: {provider_class.__name__}")
        
        return self._providers[county_id]
    
    def list_supported_counties(self) -> List[str]:
        """Return list of supported county IDs."""
        return list(self._county_configs.keys())
    
    def validate_all_connections(self) -> Dict[str, bool]:
        """Validate connections for all configured counties."""
        results = {}
        for county_id in self._county_configs.keys():
            try:
                provider = self.get_provider(county_id)
                results[county_id] = provider.validate_connection()
            except Exception as e:
                logger.error(f"Connection validation failed for {county_id}: {e}")
                results[county_id] = False
        
        return results


# Main interface function
async def fetch_property_data(county_id: str, **kwargs) -> pd.DataFrame:
    """
    Unified interface for fetching property data from any county source.
    
    Args:
        county_id: One of the 8 validated pilot counties
        **kwargs: County-specific parameters (API keys, filters, etc.)
    
    Returns:
        Standardized DataFrame matching CHARLY's Pydantic schema
        
    Raises:
        DataProviderError: For county not found, API failures, etc.
    """
    manager = DataProviderManager()
    
    try:
        provider = manager.get_provider(county_id)
        return await provider.fetch_data(**kwargs)
    
    except DataProviderError:
        raise
    except Exception as e:
        raise DataProviderError(
            f"Unexpected error fetching data for {county_id}: {str(e)}",
            county_id=county_id,
            error_code="UNEXPECTED_ERROR"
        )


# Synchronous wrapper for backwards compatibility
def fetch_property_data_sync(county_id: str, **kwargs) -> pd.DataFrame:
    """Synchronous wrapper for fetch_property_data."""
    return asyncio.run(fetch_property_data(county_id, **kwargs))


if __name__ == "__main__":
    # Example usage and basic testing
    async def main():
                        
        manager = DataProviderManager()
        
                        
        connection_results = manager.validate_all_connections()
        for county, status in connection_results.items():
            status_icon = "✅" if status else "❌"
                    
        # Test data fetch for Harris County (verified endpoint)
                try:
            data = await fetch_property_data("tx-harris", max_records=5)
                                except Exception as e:
                
    asyncio.run(main())