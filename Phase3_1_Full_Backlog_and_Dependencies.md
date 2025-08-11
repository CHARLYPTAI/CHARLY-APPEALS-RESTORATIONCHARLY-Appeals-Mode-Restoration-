# Phase 3.1 — Full Issues Backlog & Dependency Map

**Generated:** August 11, 2025  
**Repo Root:** ~/Desktop/CHARLY_TEST  
**Source:** Phase1_EnvConfig_Sanity.md, Phase2_Master_Wiring_Matrix.md, Phase3_Contract_Diff.md, codebase analysis  

---

## Table A – Issue Registry (Comprehensive)

| ID | Title | Severity | Effort | Blast Radius | Files:Lines | Evidence | Affected Flows | Depends On |
|----|-------|----------|--------|-------------|-------------|----------|----------------|------------|
| **I01** | Missing `/api/reports/unlock` endpoint | Blocker | M | Medium | Backend: Add route | reports.ts:65 vs OpenAPI | Monetizable Report | None |
| **I02** | Wrong port in download URLs (8000 vs 8001) | Blocker | S | Low | Appeals.tsx:490, Appeals 2.tsx:401,501 | Phase1 findings vs server port | File Appeal | None |
| **I03** | Property field names mismatch (camelCase vs snake_case) | Blocker | S | Low | Portfolio.tsx:740-746 | Portfolio.tsx vs PropertyCreateRequest | Create Property | None |
| **I04** | Missing certificate endpoint `/api/appeals/generate-certificate-test` | Blocker | M | Medium | Backend: Add route | Appeals.tsx:302 vs OpenAPI | File Appeal | None |
| **I05** | Unauthenticated download bypasses | Major | S | Low | Appeals.tsx:488-490 | Manual URL construction | File Appeal | None |
| **I06** | Hardcoded base URL `http://127.0.0.1:8001` | Major | S | Medium | lib/auth.ts:87,266, lib/env.ts:34 | Phase1_EnvConfig_Sanity.md:24 | All flows | None |
| **I07** | JWT secret regeneration on restart | Security | M | High | core/auth.py:25 | Phase1 findings | All flows | None |
| **I08** | Multiple inconsistent token storage keys | Major | M | High | AuthenticationManager.ts vs encryption.ts | Phase1:41, Phase3:G | All flows | None |
| **I09** | Manual fetch bypassing authenticatedRequest | Minor | S | Low | filing.ts:45 | Phase1:33, filing.ts:44-45 | Upload/Download/Export | None |
| **I10** | Missing error feedback for auth failures | Minor | S | Medium | lib/auth.ts:263,275 | Phase2:F, lib/auth.ts console.log only | All flows | None |
| **I11** | Content-type mismatch for downloads | Major | M | Medium | Backend response schemas | Appeals.tsx:329, reports.ts:107 vs OpenAPI | File Appeal, Monetizable Report | I01,I04 |
| **I12** | Permission typo `appeals.read` vs `appeal.read` | Minor | S | Low | appeals_endpoints 2.py:417,472 | Phase3 findings | File Appeal | None |
| **I13** | Undefined valuation response schema | Major | M | Medium | Backend valuation endpoint | valuation.ts:294-306 vs OpenAPI generic object | Property Workup | None |
| **I14** | Missing advanced reporting endpoints | Minor | L | Low | Multiple backend routes | AdvancedReporting.tsx calls | Advanced features | None |
| **I15** | Silent error handling in stores | Minor | S | Low | filing.ts:76,110,140,169, reports.ts:80-84 | Phase2:F console.error only | Multiple flows | None |

## Table B – Dependency Edges (Adjacency List)

```
I01 -> []                    # Unlock endpoint has no dependencies
I02 -> []                    # Port fix has no dependencies  
I03 -> []                    # Field name fix has no dependencies
I04 -> []                    # Certificate endpoint has no dependencies
I05 -> [I02]                 # Download bypasses need port fix first
I06 -> []                    # Base URL fix has no dependencies
I07 -> []                    # JWT secret fix standalone
I08 -> []                    # Token storage consolidation standalone
I09 -> []                    # Filing fetch fix standalone
I10 -> []                    # Error feedback standalone
I11 -> [I01, I04]           # Content-type needs endpoints to exist first
I12 -> []                    # Permission typo fix standalone
I13 -> []                    # Valuation schema fix standalone
I14 -> []                    # Advanced reporting endpoints standalone
I15 -> []                    # Error handling improvements standalone
```

## Table C – Bucketization

| ID | Bucket (A/B/C) | Rationale |
|----|---------------|-----------|
| **I01** | **A (Demo-Critical)** | Monetizable Report flow completely broken without unlock endpoint |
| **I02** | **A (Demo-Critical)** | All manual downloads fail due to wrong port |
| **I03** | **A (Demo-Critical)** | Create Property flow fails due to field mismatch |
| **I04** | **A (Demo-Critical)** | Certificate generation (Appeal flow) fails completely |
| **I05** | **A (Demo-Critical)** | Download security bypass breaks authenticated downloads |
| **I06** | **B (Same-day Stabilizer)** | Deployment issue but demo works locally |
| **I07** | **B (Same-day Stabilizer)** | Token invalidation on restart disrupts extended demos |
| **I08** | **B (Same-day Stabilizer)** | Auth state confusion causes intermittent failures |
| **I09** | **B (Same-day Stabilizer)** | Filing flow inconsistency, not critical to core demo |
| **I10** | **C (Post-demo Hardening)** | UX improvement, doesn't break functionality |
| **I11** | **B (Same-day Stabilizer)** | Download UX issues after endpoints are fixed |
| **I12** | **C (Post-demo Hardening)** | Permission inconsistency, but system works |
| **I13** | **B (Same-day Stabilizer)** | Property Workup flow impacted but not completely broken |
| **I14** | **C (Post-demo Hardening)** | Advanced features not part of core demo |
| **I15** | **C (Post-demo Hardening)** | Error handling improvements, doesn't break core flows |

## Table D – Proposed Execution Order

| Order | ID | Title | Why Now |
|-------|----|----|---------|
| **1** | **I01** | Add `/api/reports/unlock` endpoint | Critical path: enables monetizable reports, no dependencies |
| **2** | **I04** | Add certificate endpoint | Critical path: enables appeal certificates, no dependencies |
| **3** | **I02** | Fix wrong port in download URLs | Critical path: unblocks all downloads, needed for I05 |
| **4** | **I03** | Fix property field names | Critical path: enables property creation, no dependencies |
| **5** | **I05** | Replace unauthenticated download bypasses | Critical path: depends on I02 port fix |
| **6** | **I07** | Fix JWT secret regeneration | Stabilizer: prevents token invalidation during extended demos |
| **7** | **I08** | Consolidate token storage systems | Stabilizer: prevents auth state confusion |
| **8** | **I06** | Remove hardcoded base URLs | Stabilizer: enables proper deployment |
| **9** | **I11** | Fix download content-types | Stabilizer: improves download UX, depends on I01,I04 |
| **10** | **I13** | Define valuation response schema | Stabilizer: improves Property Workup reliability |
| **11** | **I09** | Fix filing fetch bypass | Stabilizer: consistency improvement |
| **12** | **I12** | Fix permission typo | Hardening: consistency improvement |
| **13** | **I10** | Add error feedback for auth failures | Hardening: UX improvement |
| **14** | **I15** | Improve error handling in stores | Hardening: UX improvement |
| **15** | **I14** | Add advanced reporting endpoints | Hardening: feature completeness |

---

## Risk Notes

### Coupled Files Prone to Regressions
- **`lib/auth.ts`** - Core authentication helper used by all flows; changes affect everything
- **`core/auth.py`** - Backend auth core; JWT/permission changes ripple throughout  
- **`main.py`** - Router includes; adding endpoints affects route resolution
- **`Appeals.tsx`** - Large file (1802 lines) with multiple download patterns; high regression risk

### Test Gaps Requiring Coverage
- **Integration tests for auth flow** - No coverage of JWT refresh/expiry cycles
- **Download content-type handling** - No tests for blob vs JSON response handling
- **Field name mapping** - No contract tests between UI payload and backend schema
- **Error boundary testing** - No coverage of auth failure propagation to UI

### Critical Dependencies
- **I02 must complete before I05** - Port fix required for download bypass fix
- **I01,I04 must complete before I11** - Endpoints must exist before fixing their content-types
- **Token storage consolidation (I08) affects all auth-dependent issues** - Consider early execution

---

## Summary

**Total Issues:** 15  
**Demo-Critical (Bucket A):** 5 issues  
**Same-day Stabilizers (Bucket B):** 6 issues  
**Post-demo Hardening (Bucket C):** 4 issues  

**Execution Timeline:**
- **T0 to T+4h:** Complete Bucket A (5 critical issues) for demo readiness
- **T+4h to T+24h:** Complete Bucket B (6 issues) for stability  
- **T+72h+:** Complete Bucket C (4 issues) for hardening