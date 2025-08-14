# API Contract (OpenAPI stubs)

Security: Bearer auth. Rate-limit headers in all 2xx/4xx.

POST /api/v1/uploads
* multipart/form-data → returns { upload_id, signed_urls[], pipeline: { av, exif, ocr } }

POST /api/v1/validate/commercial
* body: commercial core + { rent_roll_ref?, income_stmt_ref? }
* returns: { workfile_id, normalized, errors[], decision_preview? }

POST /api/v1/validate/residential
* body: ResidentialPropertyCore + optional { comp_refs: string[] } (metadata only)
* returns: { workfile_id, normalized, errors[], decision_preview? }

GET /api/v1/appeal-packet/{workfile_id}
* returns: PDF stream (no platform comps)

GET /api/v1/jurisdictions/{id}
GET /api/v1/jurisdictions?state=XX

Errors: RFC7807 Problem+JSON (400/401/403/404/409/422/429/5xx) with machine-readable `code`.
Idempotency: honor `Idempotency-Key` for POSTs.