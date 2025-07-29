from fastapi_backend.services.llm_router import select_llm

def test_llm_router_quality_required():
    result = select_llm(task_type="narrative", token_estimate=800, requires_high_quality=True)
    assert result in ["openai-gpt4", "anthropic-claude"]

def test_llm_router_cost_sensitive():
    result = select_llm(task_type="summary", token_estimate=1000, requires_high_quality=False, max_token_cost_usd=0.0025)
    assert result == "llama-openrouter"

def test_llm_router_fallback():
    result = select_llm(task_type="bulk", token_estimate=10000, requires_high_quality=False, max_token_cost_usd=0.001)
    assert result == "anthropic-claude"  # all others exceed budget