# CHARLY_TEST Bootstrap Context

## Project Snapshot

### Monorepo Structure
```
charly/
├─ packages/
│  ├─ core-engine/        # Decision engine (shared) - DONE T-001
│  ├─ finance/            # NOI, Cap Rate, savings calc (shared) - DONE T-001
│  ├─ contracts/          # JSON Schemas, Pydantic v2, TS + AJV validators - DONE T-001
│  └─ file-processor/     # Unified ingestion (images/PDF/CSV/XLS), OCR, EXIF scrub - DONE T-001
└─ apps/
   ├─ commercial-app/     # B2B UX - BASIC STRUCTURE
   ├─ residential-app/    # B2C UX (mobile-first) - BASIC STRUCTURE
   └─ api/                # FastAPI serving both - DONE T-001
```

### Active Tasks from TASK_QUEUE.md
- **[READY]** T-002A Pilot E2E — Don Swartz Properties (CURRENT PRIORITY)
  - DoD: Ingest PDFs under /site_tests/
  - Parse → canonical JSON (income statement, rent roll, P&L)
  - Normalize & reconcile: recoveries, vacancy, SLR, PSF math; tie to rent roll
  - Decision engine: Over/Fair/Under + confidence with rationale breadcrumbs
  - Dossier: white-label PDF (Table of Evidence, RFC7807 error pages)
  - Golden tests (snapshots locked; scripts/check-golden.sh fails CI without --bless)
  - Coverage floors: file-processor ≥90%; decision paths 100%; global ≥80%
  - Security: AV scan, EXIF scrub, PII redaction; no comps ingestion/redistribution

- **[DONE]** T-001 Commercial MVP Core
- **[IN_PROGRESS]** T-002 Commercial Customer Onboarding (3 pilots; real data; measure success)
- **[BACKLOG]** T-003 Commercial Scale
- **[BACKLOG]** T-004 Residential MVP
- **[BACKLOG]** T-005 Residential Polish
- **[BACKLOG]** T-006 Jurisdiction Rules Seed
- **[BACKLOG]** T-007 Report Templates

### Current Code Coverage Levels
- **Global Target**: ≥80% statement and branch coverage
- **Decision-Critical Paths**: 100% coverage requirement
- **Current Status**: 
  - packages/finance: 100% coverage ✓ (T-001 complete)
  - packages/core-engine: 100% coverage ✓ (T-001 complete)
  - packages/contracts: 100% coverage ✓ (T-001 complete)
  - packages/file-processor: 100% coverage ✓ (T-001 complete)
  - apps/api: Active development - current coverage tracking in CI

### Current Security Status
- **AV Scanning**: Fail-closed policy for all file uploads
- **EXIF Scrubbing**: Automatic metadata removal from images
- **HTTP Headers**: CSP, HSTS, X-Frame-Options implemented
- **Request Limits**: Size caps and content-type allowlisting active
- **Authentication**: OAuth2 Device Code or email-link ready
- **Secrets Management**: Vault/SM integration, no secrets in repo
- **SAST/DAST**: CodeQL + npm audit + ZAP baseline on PR
- **PII Protection**: RFC7807 error responses, no sensitive data in logs

### Current Jurisdictional and Onboarding State
- Commercial-first approach active
- T-002 pilot phase with Don Swartz Properties
- Real data ingestion and validation pipeline
- White-label PDF dossier generation capability
- Success measurement framework in place

## Execution Guardrails

### Code Quality Standards
- **No speculative code or hallucinations** — all changes must be grounded in verified repo state
- **No removal of working features** unless explicitly approved by user
- **All changes must preserve existing functionality** unless task requires modification
- **Always work sequentially, one task at a time** — no skipping ahead without completing current task
- **No UI/UX drift** — preserve locked designs unless explicitly instructed
- **All code must pass linting, typing, coverage, and security scans** before commit

### Development Process
- Execute only the first `[READY]` task from TASK_QUEUE.md
- Produce full file replacements, never partial snippets unless explicitly approved
- Maintain coverage thresholds: global ≥80%; decision-critical paths 100%
- Update DECISION_LOG.md (what/why) and TASK_QUEUE.md (status diffs + next [READY])
- If blocked, propose smallest edit to /cc_ops/* as full file replacement and stop

### Context Management
- Load /BOOTSTRAP.md, /cc_ops/TASK_QUEUE.md, /cc_ops/DECISION_LOG.md every session start
- Verify BOOTSTRAP.md SHA256 equals .bootstrap_hash before ANY work
- Follow /cc_ops/* standards and .github/workflows/* quality/security gates
- No drift, no rewrites of process without explicit approval

## Security Guardrails

### Input Validation & Protection
- **Enforce strict input validation** on all user inputs and file uploads
- **PII Protection**: No personally identifiable information in logs or error messages
- **Safe file handling**: All uploads must pass AV scanning and EXIF scrubbing
- **Content-type validation**: Strict allowlisting for uploaded file types
- **Size limits**: Enforce maximum file sizes to prevent resource exhaustion

### HTTP Security Headers
- **CSP (Content Security Policy)**: Prevent XSS attacks
- **HSTS (HTTP Strict Transport Security)**: Enforce HTTPS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **Referrer-Policy**: Control referrer information leakage

### Data Security
- **No sensitive data in logs**: Sanitize all logging output
- **No sensitive data in error messages**: Use RFC7807 compliant error responses
- **Encryption at rest**: All sensitive data encrypted in storage
- **Encryption in transit**: TLS 1.3 minimum for all communications

### Access Control
- **Authentication required**: OAuth2 Device Code or email-link for access
- **Authorization checks**: RBAC with org-scoped roles
- **Session management**: Short-lived JWT with refresh token rotation
- **CSRF protection**: Required for all state-changing operations

## Operational Guardrails

### Code Standards
- **Respond with full file rewrites**, never partial snippets, unless explicitly approved
- **Preserve formatting and style consistency** with existing code
- **Follow existing patterns**: Use established libraries, utilities, and architectural patterns
- **Security best practices**: Never introduce code that exposes or logs secrets
- **No secrets in repository**: All credentials managed through external secret stores

### Documentation & Traceability
- **All steps documented in commit messages** with clear rationale
- **Decision tracking**: Update DECISION_LOG.md for significant architectural choices
- **Test coverage documentation**: Maintain coverage reports and thresholds
- **Security scan results**: Document and address all security findings

### Quality Assurance
- **Linting**: All code must pass configured linters
- **Type checking**: Strict TypeScript and Python type checking required
- **Testing**: Comprehensive test coverage with automated execution
- **Integration testing**: End-to-end testing for critical user flows
- **Golden testing**: Snapshot tests locked for regression prevention

## CI Integration Requirements

### GitHub Actions Workflow (cc_quality_gate.yml)
The CI pipeline enforces the following checks:

1. **Bootstrap Integrity**: Verify BOOTSTRAP.md SHA256 matches .bootstrap_hash
2. **Test Coverage**: 
   - Global coverage ≥80% (statement and branch)
   - Decision-critical paths: 100% coverage
   - New code in core modules: 100% coverage
3. **Security Scanning**:
   - Static analysis (bandit, CodeQL)
   - Dependency vulnerability scanning (safety, npm audit)
   - DAST scanning (ZAP baseline)
4. **Code Quality**:
   - Linting and type checking
   - No drift in cc_ops/ directory
   - Build verification

### Failure Conditions
The build automatically fails if:
- Coverage drops below 80% global threshold
- Decision-critical modules have <100% coverage
- Security vulnerabilities detected (high or critical)
- BOOTSTRAP.md integrity check fails (hash mismatch)
- cc_ops/ directory changes without proper approval
- Linting or type checking errors

## Startup Command

To restore context and resume execution in any new Claude Code session:

```bash
cd /Users/georgewohlleb/Desktop/CHARLY_TEST && echo "🔒 BOOTSTRAP LOADED: $(date)" && echo "📋 VERIFYING HASH..." && EXPECTED_HASH=$(cat .bootstrap_hash 2>/dev/null || echo "NONE") && CURRENT_HASH=$(shasum -a 256 BOOTSTRAP.md | awk '{print $1}') && echo "Expected: $EXPECTED_HASH" && echo "Current : $CURRENT_HASH" && if [ "$EXPECTED_HASH" = "$CURRENT_HASH" ]; then echo "✅ HASH VERIFIED" && echo "📖 LOADING CONTEXT..." && cat cc_ops/TASK_QUEUE.md | grep -A5 "\[READY\]" | head -10 && echo "🚀 READY TO EXECUTE"; else echo "❌ HASH MISMATCH - STOPPING" && exit 1; fi
```

## File Integrity Hash

SHA256: 3cec73d525282d2e2852cc5fb4081d1966c91a2fda2780d0e851a789d9e899aa

---

**Generated**: 2025-08-14  
**Purpose**: Permanent execution context lock for CHARLY_TEST monorepo  
**Scope**: All future Claude Code sessions must verify and load this context  
**Authority**: CTO-level execution standards with zero drift tolerance