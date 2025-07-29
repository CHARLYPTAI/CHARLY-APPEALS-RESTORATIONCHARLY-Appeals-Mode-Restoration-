import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi_backend.services.bulk_narrative_generator import bulk_generate_narratives, bulk_generate_narratives_sync
from fastapi_backend.ai.charly_gpt_narrative_generator import SettingsModel


@pytest.mark.asyncio
async def test_bulk_generate_narratives():
    """Test async bulk narrative generation with mocked generate_narrative"""
    
    # Mock settings
    mock_settings = MagicMock(spec=SettingsModel)
    
    # Test properties
    properties = [
        {
            "property_id": "P001",
            "property_data": {"address": "123 Main St"},
            "financials": {"NOI": 75000},
            "flags": {"overassessed": True}
        },
        {
            "property_id": "P002",
            "property_data": {"address": "456 Oak Ave"},
            "financials": {"NOI": 50000},
            "flags": {"expense_ratio": True}
        }
    ]
    
    # Mock the generate_narrative function
    with patch('fastapi_backend.services.bulk_narrative_generator.generate_narrative') as mock_generate:
        # Set up mock responses
        mock_generate.side_effect = [
            {
                "narrative": "This property at 123 Main St is overassessed...",
                "model_used": "anthropic-claude",
                "tokens_used": 650
            },
            {
                "narrative": "The property at 456 Oak Ave shows high expense ratio...",
                "model_used": "anthropic-claude",
                "tokens_used": 700
            }
        ]
        
        # Run bulk generation
        results = await bulk_generate_narratives(
            properties=properties,
            settings=mock_settings,
            max_token_cost_usd=0.01
        )
        
        # Assertions
        assert len(results) == 2
        
        # Check first property result
        assert results[0]["property_id"] == "P001"
        assert results[0]["address"] == "123 Main St"
        assert "narrative" in results[0]
        assert results[0]["model_used"] == "anthropic-claude"
        
        # Check second property result
        assert results[1]["property_id"] == "P002"
        assert results[1]["address"] == "456 Oak Ave"
        assert "narrative" in results[1]
        
        # Verify generate_narrative was called twice
        assert mock_generate.call_count == 2


def test_bulk_generate_narratives_sync():
    """Test synchronous wrapper for bulk narrative generation"""
    
    # Mock settings
    mock_settings = MagicMock(spec=SettingsModel)
    
    # Test properties
    properties = [
        {
            "property_id": "P003",
            "property_data": {"address": "789 Elm St"},
            "financials": {"NOI": 100000},
            "flags": {"cap_rate": True}
        }
    ]
    
    # Mock the async generate_narrative function
    async def mock_async_generate(*args, **kwargs):
        return {
            "narrative": "Property at 789 Elm St analysis...",
            "model_used": "llama-openrouter",
            "tokens_used": 500
        }
    
    with patch('fastapi_backend.services.bulk_narrative_generator.generate_narrative', mock_async_generate):
        # Run sync version
        results = bulk_generate_narratives_sync(
            properties=properties,
            settings=mock_settings,
            max_token_cost_usd=0.005,
            require_high_quality=False
        )
        
        # Assertions
        assert len(results) == 1
        assert results[0]["property_id"] == "P003"
        assert results[0]["address"] == "789 Elm St"
        assert "narrative" in results[0]


@pytest.mark.asyncio
async def test_bulk_generate_with_error_handling():
    """Test error handling in bulk narrative generation"""
    
    # Mock settings
    mock_settings = MagicMock(spec=SettingsModel)
    
    # Test properties
    properties = [
        {
            "property_id": "P004",
            "property_data": {"address": "999 Error Lane"},
            "financials": {},
            "flags": {}
        }
    ]
    
    # Mock generate_narrative to raise an exception
    with patch('fastapi_backend.services.bulk_narrative_generator.generate_narrative') as mock_generate:
        mock_generate.side_effect = Exception("API error: rate limit exceeded")
        
        # Run bulk generation
        results = await bulk_generate_narratives(
            properties=properties,
            settings=mock_settings
        )
        
        # Should handle error gracefully
        assert len(results) == 1
        assert results[0]["property_id"] == "P004"
        assert "error" in results[0]
        assert "API error: rate limit exceeded" in results[0]["error"]
        assert results[0]["model_attempted"] in ["openai-gpt4", "anthropic-claude"]


def test_llm_router_integration():
    """Test that bulk generator correctly uses llm_router"""
    
    from fastapi_backend.services.llm_router import select_llm
    
    # Test high-quality requirement routes to premium models
    model = select_llm(
        task_type="narrative",
        token_estimate=750,
        requires_high_quality=True,
        max_token_cost_usd=0.02
    )
    assert model in ["openai-gpt4", "anthropic-claude"]
    
    # Test budget constraint routes to cheaper model
    model = select_llm(
        task_type="narrative",
        token_estimate=750,
        requires_high_quality=False,
        max_token_cost_usd=0.002
    )
    assert model == "llama-openrouter"