# Phase 3 — Contract Diff (UI ↔ API Complete Mismatch Analysis)

**Generated:** August 11, 2025  
**Repo Root:** ~/Desktop/CHARLY_TEST  
**Frontend:** charly_ui (React 18, TS, Vite)  
**Backend:** fastapi_backend (FastAPI, Pydantic v2)  

**Grounded Issues Verified:**
- ✅ reports.ts:65 calls `/api/reports/unlock` (not in OpenAPI)
- ✅ Appeals.tsx:490 hardcodes localhost:8000 (server = 8001)  
- ✅ Portfolio.tsx:740 uses `propertyType` vs backend `property_type`
- ✅ Appeals.tsx:302 calls `/api/appeals/generate-certificate-test` (missing)
- ✅ Appeals.tsx:488–490 builds unauthenticated download URLs (bypasses authenticatedRequest)

---

## Table A – UI-Only Calls (No Backend)

| File:Line | Method | Path | Intended Purpose | OpenAPI/Router Evidence | Risk (Blocks Demo?) |
|-----------|--------|------|------------------|------------------------|-------------------|
| reports.ts:65 | POST | `/api/reports/unlock` | Unlock monetizable report for download | Not in OpenAPI paths | ❌ **YES** - Blocks monetizable reports |
| Appeals.tsx:302 | POST | `/api/appeals/generate-certificate-test` | Generate appeal certificate PDF | Not in OpenAPI paths | ❌ **YES** - Blocks certificate generation |
| AdvancedReporting.tsx:* | GET/POST | `/api/reports/templates`, `/api/reports/jobs`, `/api/reports/schedules` | Advanced reporting features | Not in OpenAPI paths | ⚠️ **MAYBE** - Advanced features only |
| WebVitalsMonitor.tsx:* | POST | `/api/metrics/web-vitals` | Performance monitoring | Not in OpenAPI paths | ✅ **NO** - Monitoring only |
| MonitoringDashboard.tsx:* | GET | `/api/metrics/dashboard` | Monitoring dashboard | Not in OpenAPI paths | ✅ **NO** - Monitoring only |
| lib/api.ts:* | POST | `/api/ingest` | Data ingestion | Not in OpenAPI paths | ⚠️ **MAYBE** - Data import flow |

## Table B – Backend-Only, Unused by UI

| Method | Path | Router Function (file:line) | Auth/Perm | Suggested UI Use? |
|--------|------|----------------------------|-----------|------------------|
| GET | `/api/appeals/templates` | get_appeal_templates (appeals_endpoints.py:1210) | appeal.read | ✅ Could replace missing certificate templates |
| POST | `/api/appeals/bulk-generate` | bulk_generate_appeals (OpenAPI) | HTTPBearer | ✅ Bulk appeal generation feature |
| GET | `/api/appeals/deadlines` | get_appeal_deadlines (OpenAPI) | HTTPBearer | ✅ Deadline tracking feature |
| GET | `/api/portfolio/summary` | get_portfolio_summary (OpenAPI) | HTTPBearer | ✅ Portfolio dashboard summaries |
| POST | `/api/portfolio/bulk/status` | bulk_update_status (OpenAPI) | HTTPBearer | ✅ Bulk operations |
| GET | `/api/reports/analytics` | get_report_analytics (OpenAPI) | HTTPBearer | ✅ Replace missing metrics endpoints |

## Table C – Auth/Permission Diff

| UI Call (file:line) | Backend Path | Required (Auth/Perm) | What UI Sends | Evidence | Severity |
|---------------------|--------------|---------------------|---------------|----------|----------|
| Appeals.tsx:490 | download_url | None (manual URL) | None | Appeals.tsx:488-490 bypasses authenticatedRequest | **High** |
| Appeals 2.tsx:401,501 | download_url | None (manual URL) | None | Appeals 2.tsx:399-501 bypasses authenticatedRequest | **High** |
| filing.ts:45 | `/api/filing/packets` | HTTPBearer | Manual auth header | filing.ts:44-45 manual fetch + auth | **Medium** |
| Appeals.tsx:593 | `/api/appeals/generate-packet` | HTTPBearer + **appeal.read** | Bearer via authenticatedRequest | appeals_endpoints.py:1265 vs Appeals.tsx:593 | **Medium** |

## Table D – Schema Diff

| Flow | UI Payload Field | Backend Field | Type/Required Diff | Evidence (UI & OpenAPI/file:line) | Severity |
|------|------------------|---------------|-------------------|----------------------------------|----------|
| Create Property | `propertyType` | `property_type` | Field name mismatch | Portfolio.tsx:740 vs PropertyCreateRequest schema | **High** |
| Create Property | `currentAssessment` | `current_assessment` | Field name mismatch | Portfolio.tsx:741 vs PropertyCreateRequest schema | **High** |
| Create Property | `estimatedValue` | `market_value` | Field name mismatch | Portfolio.tsx:742 vs PropertyCreateRequest schema | **High** |
| Appeal Generation | `appeal_data` object | Generic object | Unknown structure | Appeals.tsx:307 vs OpenAPI generic object | **Medium** |
| Valuation Load | Expects `isDraft`, `income`, `sales` | Generic object returned | Structure mismatch | valuation.ts:294-306 vs OpenAPI | **Medium** |

## Table E – Transport Issues

| File:Line | Pattern | Correct Contract (Relative? Helper?) | Why It Breaks | Severity |
|-----------|---------|-------------------------------------|---------------|----------|
| Appeals.tsx:490 | `http://localhost:8000${download_url}` | Relative path via authenticatedRequest | Server runs on 8001, not 8000 | **High** |
| Appeals 2.tsx:401,501 | `http://localhost:8000${download_url}` | Relative path via authenticatedRequest | Server runs on 8001, not 8000 | **High** |
| lib/auth.ts:87,266 | `http://127.0.0.1:8001` hardcoded | Relative `/api/` paths | Production deployment issues | **High** |
| AuthenticationManager.ts:* | `http://localhost:8000` hardcoded | Environment variable | Wrong port for current server | **Medium** |
| filing.ts:45 | Manual fetch with auth header | Use authenticatedRequest() helper | No token refresh, inconsistent headers | **Medium** |

## Table F – Content-Type Alignment

| Endpoint | Backend CT/Headers | Frontend Handling (file:line) | Alignment? | Evidence | Severity |
|----------|-------------------|-------------------------------|------------|----------|----------|
| `/api/appeals/download/{packet_id}` | Generic object (OpenAPI) | Expects blob (Appeals.tsx:329) | ❌ **NO** | Appeals.tsx:329 vs OpenAPI schema | **High** |
| `/api/reports/download/{report_id}` | Generic object (OpenAPI) | Expects blob (reports.ts:107) | ❌ **NO** | reports.ts:107 vs OpenAPI schema | **High** |
| `/api/portfolio/` POST | Expects PropertyCreateRequest | Sends different field names | ❌ **NO** | Portfolio.tsx:738-747 vs OpenAPI | **High** |
| Manual download URLs | Unknown | Direct window.open | ❌ **NO** | Appeals.tsx:490 - no content-type handling | **High** |

## Table G – Token Storage Diff

| Key Name | Set At (file:line) | Read At | Cleared At | Drift/Conflict | Demo Impact |
|----------|-------------------|---------|------------|---------------|-------------|
| `charly_auth_tokens` | AuthenticationManager.ts:* | AuthenticationManager.ts:* | AuthenticationManager.ts:461 | ✅ Consistent | Low |
| `charly_refresh_token` | AuthenticationManager.ts:* | AuthenticationManager.ts:* | AuthenticationManager.ts:462 | ✅ Consistent | Low |
| `access_token` | encryption.ts:198 | encryption.ts:199 | encryption.ts:* | ⚠️ **Parallel system** | Medium |
| `refresh_token` | encryption.ts:198 | encryption.ts:199 | encryption.ts:* | ⚠️ **Parallel system** | Medium |
| TOKEN_STORAGE_KEY | AuthenticationManager.ts:73 | AuthenticationManager.ts:* | AuthenticationManager.ts:461 | ✅ Consistent | Low |
| SESSION_KEY | AuthenticationManager.ts:74 | AuthenticationManager.ts:* | Logout clears | ✅ Consistent | Low |

## Table H – Minimal Fix Queue (Ranked by Priority)

| Priority | Issue | Impact | Effort | Blast Radius | Files:Lines | One-Line Patch Definition |
|----------|-------|---------|--------|-------------|-------------|--------------------------|
| **1** | Missing `/api/reports/unlock` endpoint | Blocks monetizable reports | **M** | **Medium** | Backend: Add unlock route | Add POST /api/reports/unlock endpoint that returns download_url |
| **2** | Wrong port in download URLs | Blocks all manual downloads | **S** | **Low** | Appeals.tsx:490, Appeals 2.tsx:401,501 | Replace localhost:8000 with relative paths via authenticatedRequest |
| **3** | Property creation field mismatches | Blocks property creation | **S** | **Low** | Portfolio.tsx:740-746 | Convert camelCase to snake_case in request payload |
| **4** | Missing certificate endpoint | Blocks certificate generation | **M** | **Medium** | Backend: Add certificate route | Add POST /api/appeals/generate-certificate endpoint or use existing templates |
| **5** | Unauthenticated download bypasses | Security risk, inconsistent auth | **S** | **Low** | Appeals.tsx:488-490 | Replace manual URL construction with authenticatedRequest calls |
| **6** | Hardcoded base URLs | Deployment portability issues | **S** | **Medium** | lib/auth.ts:87,266 | Use relative paths instead of absolute http://127.0.0.1:8001 |
| **7** | Content-type mismatches for downloads | Download handling failures | **M** | **Medium** | Backend response schemas | Ensure download endpoints return proper file streams with Content-Disposition |
| **8** | Permission typo inconsistency | Some routes use appeals.read vs appeal.read | **S** | **Low** | appeals_endpoints 2.py:417,472 | Standardize on appeal.read across all endpoints |
| **9** | Manual fetch bypassing helper | Inconsistent auth handling | **S** | **Low** | filing.ts:45 | Replace manual fetch with authenticatedRequest |
| **10** | Parallel token storage systems | Potential auth state confusion | **M** | **High** | AuthenticationManager vs encryption.ts | Consolidate to single token storage system |

---

## Summary

**Phase 3 contract diff ready.**

**Top 5 fixes by priority:**

1. **Add missing `/api/reports/unlock` endpoint** - Backend needs POST route that validates payment and returns download_url for monetizable reports

2. **Fix hardcoded localhost:8000 in download URLs** - Replace manual URL construction in Appeals.tsx:490 and Appeals 2.tsx with relative paths via authenticatedRequest

3. **Convert property creation field names to snake_case** - Change Portfolio.tsx:740-746 from `propertyType/currentAssessment/estimatedValue` to `property_type/current_assessment/market_value`

4. **Add missing certificate generation endpoint** - Backend needs POST `/api/appeals/generate-certificate` route or redirect UI to existing `/api/appeals/templates`

5. **Replace unauthenticated download bypasses with authenticatedRequest** - Appeals.tsx:488-490 should use helper instead of manual localhost:8000 URL construction