# Task Queue

> Status values: BACKLOG | READY | IN_PROGRESS | BLOCKED | DONE

# Architecture: two apps, one brain

charly/
├─ packages/
│  ├─ core-engine/        # Decision engine (shared)
│  ├─ finance/            # NOI, Cap Rate, savings calc (shared)
│  ├─ contracts/          # JSON Schemas, Pydantic v2, TS + AJV validators
│  └─ file-processor/     # Unified ingestion (images/PDF/CSV/XLS), OCR, EXIF scrub
└─ apps/
   ├─ commercial-app/     # B2B UX
   ├─ residential-app/    # B2C UX (mobile-first)
   └─ api/                # FastAPI serving both

# Commercial-first

* [READY] T-002A Pilot E2E — Don Swartz Properties
  DoD:
  * Ingest PDFs under /site_tests/ (see BOOTSTRAP.md list)
  * Parse → canonical JSON (income statement, rent roll, P&L)
  * Normalize & reconcile: recoveries, vacancy, SLR, PSF math; tie to rent roll
  * Decision engine: Over/Fair/Under + confidence with rationale breadcrumbs
  * Dossier: white-label PDF (Table of Evidence, RFC7807 error pages)
  * Golden tests (snapshots locked; scripts/check-golden.sh fails CI without --bless)
  * Coverage floors: file-processor ≥90%; decision paths 100%; global ≥80%
  * Security: AV scan, EXIF scrub, PII redaction; no comps ingestion/redistribution

* [DONE] T-001 Commercial MVP Core
  deliverables:
  * packages/finance: NOI/Cap, tax savings; 100% coverage ✓
  * packages/core-engine: decision Over/Fair/Under + rationale; 100% coverage ✓
  * packages/contracts: commercial schemas (core property, rent roll meta, income stmt meta) + TS + AJV ✓
  * packages/file-processor: minimal commercial ingestion (PDF/CSV) with OCR/EXIF/AV ✓
  * apps/api: POST /validate/commercial, POST /uploads, GET /appeal-packet/{workfile_id}; integration tests ✓
  * one beautiful white-label-ready Commercial PDF (Appeal Dossier v1) ✓

* [IN_PROGRESS] T-002 Commercial Customer Onboarding (3 pilots; real data; measure success)

* [BACKLOG] T-003 Commercial Scale (bulk upload, portfolio dashboard, exports, SSO/SAML, API tokens, white-label config)

# Residential next

* [BACKLOG] T-004 Residential MVP (simplified parser; instant decision; mobile-first UI; Stripe + Apple Pay)

* [BACKLOG] T-005 Residential Polish (PWA/mobile app; social proof; referral system)

* [BACKLOG] T-006 Jurisdiction Rules Seed (Top 50): deadlines, fees, forms, e-file flags

* [BACKLOG] T-007 Report Templates: Audit Lite, Appeal Dossier, Fair/Under, Portfolio CFO Summary