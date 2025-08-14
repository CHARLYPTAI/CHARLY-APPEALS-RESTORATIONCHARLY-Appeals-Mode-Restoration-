# Data & Storage

* DB: Postgres 15; migrations via Alembic (Py) OR Prisma (TS) — standardize one and document
* Blob: S3-compatible bucket; server-side encryption; lifecycle rules per retention
* Queues: SQS-compatible for OCR/parsing
* Schema versioning: semver + `x-schema-version` header; idempotent migrations
* Entities: properties, valuations, appeals, uploads, jurisdiction_rules, users, orgs, audit_logs, leads
* Idempotency: `Idempotency-Key` honored for POST uploads & validations (store request hash 24h)