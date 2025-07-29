import os
import logging
from typing import Dict, Any

import openai

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Load OpenAI API key from environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")
openai.api_key = OPENAI_API_KEY


def build_prompt(
    property_data: Dict[str, Any], financials: Dict[str, Any], flags: Dict[str, bool]
) -> str:
    prompt = f"""
You are an expert commercial property tax consultant.

Here is the property data:
{property_data}

Here are the financial metrics:
{financials}

Here are the important flags:
{flags}

Please generate a concise, professional property tax appeal narrative highlighting key valuation risks and opportunities.
Focus on overassessment, vacancy issues, and expense anomalies flagged.

Begin narrative:
"""
    return prompt


def generate_narrative(
    property_data: Dict[str, Any], financials: Dict[str, Any], flags: Dict[str, bool]
) -> str:
    from typing import Any  # Import here to help with type hint

    prompt = build_prompt(property_data, financials, flags)

    try:
        response: Any = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful and professional tax appeal assistant.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=400,
            n=1,
        )
        narrative = response.choices[0].message.content.strip()  # type: ignore[attr-defined]
        logger.info("Generated narrative successfully.")
        return narrative
    except Exception as e:
        logger.error(f"Error generating narrative: {e}")
        return "Narrative generation failed."


if __name__ == "__main__":
    # Quick test example with dummy data
    property_example = {
        "potential_gross_income": 1000000,
        "vacancy_rate": 0.07,
        "operating_expenses": 300000,
        "market_value": 5000000,
        "assessment_value": 4500000,
        "jurisdiction_tax_rate": 0.012,
    }
    financials_example = {
        "effective_gross_income": 930000,
        "net_operating_income": 630000,
        "capitalization_rate_market_value": 0.126,
        "capitalization_rate_assessment_value": 0.14,
        "expense_ratio": 0.32,
        "vacancy_rate": 0.07,
    }
    flags_example = {
        "overassessment": False,
        "vacancy_anomaly": False,
        "expense_ratio_flag": False,
        "depreciation_flag": False,
    }

    print(generate_narrative(property_example, financials_example, flags_example))
