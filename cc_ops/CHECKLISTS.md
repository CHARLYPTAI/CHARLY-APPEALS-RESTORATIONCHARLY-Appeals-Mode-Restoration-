# Checklists

## Schema Task DoD

* [ ] JSON Schema with examples + edge cases
* [ ] Pydantic v2 models with custom validators
* [ ] TypeScript interfaces with AJV validators
* [ ] Unit tests for validation edge cases
* [ ] Integration tests with malformed inputs

## Ingestion Task DoD

* [ ] File type validation (MIME + magic bytes)
* [ ] Size limits enforced (≤50MB/file, ≤200MB/request)
* [ ] AV scan integration (fail-closed)
* [ ] EXIF stripping for images
* [ ] OCR pipeline for PDFs
* [ ] Hash+dedupe mechanism
* [ ] Signed URL generation
* [ ] Error handling + retry logic

## Report Task DoD

* [ ] Template engine with white-label capability
* [ ] PDF generation with embedded fonts
* [ ] Data sanitization (no PII exposure)
* [ ] User-supplied evidence only (no platform comps)
* [ ] Watermarking + document security
* [ ] Performance benchmarks (render time)

## Enterprise DoD (Commercial)

* [ ] Multi-tenant data isolation
* [ ] RBAC with org-scoped permissions
* [ ] SSO/SAML integration points
* [ ] API token management
* [ ] Audit logging for compliance
* [ ] White-label configuration
* [ ] SLA monitoring endpoints