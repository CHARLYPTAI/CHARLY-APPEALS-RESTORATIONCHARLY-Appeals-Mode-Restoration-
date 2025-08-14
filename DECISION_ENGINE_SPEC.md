# Decision Engine

Inputs: assessed_value, est_market_value, value_confidence, tax_rate, jurisdiction priors (success rate, fees)

Logic:
* Over if (assessed/market) > 1.05 OR outside confidence band, AND expected_savings×success_prob > (fees+effort)
* Fair if within band (± COD target)
* Under if (assessed/market) < 0.95 OR strong under; warn reassessment risk

Outputs: { label, rationale[], savings_estimate, sensitivity }

Guards: show bands; never claim certainty; no comps in free SKU.