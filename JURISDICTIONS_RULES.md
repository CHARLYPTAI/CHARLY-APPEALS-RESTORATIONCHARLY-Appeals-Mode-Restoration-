# Jurisdiction Rules

JSON fields per jurisdiction:
{ jurisdiction_id, name, state, appeal_window_start, appeal_window_end, deadline_rule, fee, forms[], efile_available, evidence_preshare_required, decision_standard, citations[] }

Endpoints: GET /api/v1/jurisdictions/{id}; GET /api/v1/jurisdictions?state=..

## Seed minimal /seed/jurisdictions.json with 3 realistic examples (no proprietary content).