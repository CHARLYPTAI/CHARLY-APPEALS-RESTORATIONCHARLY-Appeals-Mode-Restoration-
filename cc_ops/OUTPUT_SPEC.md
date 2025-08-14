# Output Spec

## Products (SKUs)

* Audit Lite (Free teaser): assessment ratio band, risk tier, deadline, CTA. *No comps.*
* Appeal Dossier (Paid): our analysis + user-provided evidence (comps/photos/appraisals). *No resale or sharing of comps.*
* Fair/Under Report (Paid): explains why appeal is risky; preserves goodwill.
* Portfolio CFO Summary (Paid): multi-asset rollup, deadlines, savings estimate, CSV export.

## Guardrails

* We **never** distribute comps. Users supply comps; stored per-tenant; NOT used across tenants unless explicit license.
* Photos/Appraisals: accept JPG/PNG/PDF/XLS/XLSX/CSV; strip EXIF; AV scan; thumbnails; OCR; hash+dedupe.
* Decision Engine: classify Over/Fair/Under with rationale & confidence band.
* Filing: no contingency. E-file only where safe API exists; avoid actions risking API lockout.
* Leads: only aggregate, anonymized insights; opt-out honored.

## Engineering Bars

* Global tests ≥80%; **Decision & Finance** packages 100% coverage + property-based tests.
* AJV validators as standalone bundles; Pydantic v2 custom validators.
* Logging redacts PII; blob storage via signed URLs + server-side encryption.
* Integration tests cover full user journeys (Commercial MVP, Residential MVP).