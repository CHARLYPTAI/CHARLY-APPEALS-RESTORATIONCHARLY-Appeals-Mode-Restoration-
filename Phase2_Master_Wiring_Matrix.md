# Phase 2 — Master Wiring Matrix (UI ↔ API ↔ Auth ↔ Schema)

**Generated:** August 11, 2025  
**Repo Root:** ~/Desktop/CHARLY_TEST  
**Frontend:** charly_ui (React 18, TS, Vite)  
**Backend:** fastapi_backend (FastAPI, Pydantic v2)  

---

## Flow 1: Create Property (Portfolio Add)

### A) UI → API Call Trace

| UI Component | Handler (file:line) | Uses Helper? | Method | Path (as coded) | Final URL Resolution | Headers (Auth/CT) | Payload Builder (file:line) |
|--------------|---------------------|--------------|--------|-----------------|---------------------|-------------------|---------------------------|
| Portfolio.tsx | handleAddProperty:701 | ✅ Yes | POST | `/api/portfolio/` | `http://127.0.0.1:8001/api/portfolio/` | `Authorization: Bearer`, `Content-Type: application/json` | Portfolio.tsx:717-747 |

### B) Backend Handler Mapping

| Router | Function (file:line) | Auth | Permission | OpenAPI OperationId | Request Schema Ref | Response Schema Ref |
|--------|---------------------|------|------------|-------------------|-------------------|-------------------|
| portfolio | create_property (main.py:implied) | HTTPBearer | None | `create_property_api_portfolio__post` | `PropertyCreateRequest` | `PropertyRecord` |

### C) Contract Comparison

| Aspect | UI Expectation | Backend Spec | Evidence (file:line / OpenAPI ref) | Mismatch? |
|--------|---------------|--------------|-----------------------------------|-----------|
| Field names/types | `property_type`, `current_assessment`, `market_value` | `property_type`, `current_assessment`, `market_value` | Portfolio.tsx:740-746 vs PropertyCreateRequest schema | ❌ Yes |
| Required/optional | Address, propertyType, currentAssessment required | Address, property_type, current_assessment required | Portfolio.tsx:717 vs PropertyCreateRequest | ❌ Yes |
| Content-Type | `application/json` | Expected `application/json` | Portfolio.tsx:736 vs OpenAPI | ✅ No |
| Status handling | Expects JSON response | Returns PropertyRecord | Portfolio.tsx:750+ vs PropertyRecord schema | ❌ Yes |

### D) Known Break Points

| Break Point | Why It Fails | Evidence (file:line) | Severity (High/Med/Low) | Related Risk |
|------------|--------------|---------------------|----------------------|--------------|
| Field name mismatch | UI sends `propertyType`, backend expects `property_type` | Portfolio.tsx:740 | High | Schema drift |
| Hardcoded base URL | Base URL hardcoded to 127.0.0.1:8001 | lib/auth.ts:87,266 | High | Phase 1 Risk #2 |

---

## Flow 2: Generate Property Workup (Valuation Analysis)

### A) UI → API Call Trace

| UI Component | Handler (file:line) | Uses Helper? | Method | Path (as coded) | Final URL Resolution | Headers (Auth/CT) | Payload Builder (file:line) |
|--------------|---------------------|--------------|--------|-----------------|---------------------|-------------------|---------------------------|
| valuation.ts | loadValuation:280 | ✅ Yes | GET | `/api/portfolio/valuation/{propertyId}` | `http://127.0.0.1:8001/api/portfolio/valuation/{id}` | `Authorization: Bearer` | N/A (GET request) |

### B) Backend Handler Mapping

| Router | Function (file:line) | Auth | Permission | OpenAPI OperationId | Request Schema Ref | Response Schema Ref |
|--------|---------------------|------|------------|-------------------|-------------------|-------------------|
| portfolio | get_property_valuation (main.py:implied) | HTTPBearer | None | `get_property_valuation_api_portfolio_valuation__property_id__get` | None | Generic object |

### C) Contract Comparison

| Aspect | UI Expectation | Backend Spec | Evidence (file:line / OpenAPI ref) | Mismatch? |
|--------|---------------|--------------|-----------------------------------|-----------|
| Field names/types | `isDraft`, `income`, `sales`, `apiValuation` | Generic object | valuation.ts:294-306 vs OpenAPI schema | ❌ Unknown |
| Required/optional | Expects structured valuation data | Returns generic object | valuation.ts:294 vs OpenAPI | ❌ Yes |
| Content-Type | Expects JSON | Returns JSON | valuation.ts:291 vs OpenAPI | ✅ No |
| Status handling | Checks `response.ok` | Standard HTTP codes | valuation.ts:287 vs OpenAPI | ✅ No |

### D) Known Break Points

| Break Point | Why It Fails | Evidence (file:line) | Severity (High/Med/Low) | Related Risk |
|------------|--------------|---------------------|----------------------|--------------|
| Undefined response schema | Backend returns generic object, UI expects specific fields | valuation.ts:294 vs OpenAPI | High | Schema mismatch |

---

## Flow 3: File Appeal (Generate → Status → Download)

### A) UI → API Call Trace

| UI Component | Handler (file:line) | Uses Helper? | Method | Path (as coded) | Final URL Resolution | Headers (Auth/CT) | Payload Builder (file:line) |
|--------------|---------------------|--------------|--------|-----------------|---------------------|-------------------|---------------------------|
| Appeals.tsx | handleGenerateCertificate:281 | ✅ Yes | POST | `/api/appeals/generate-certificate-test` | `http://127.0.0.1:8001/api/appeals/generate-certificate-test` | `Authorization: Bearer`, `Content-Type: application/json` | Appeals.tsx:286-309 |
| Appeals.tsx | generateAppealPacket:593 | ✅ Yes | POST | `/api/appeals/generate-packet` | `http://127.0.0.1:8001/api/appeals/generate-packet` | `Authorization: Bearer`, `Content-Type: application/json` | Appeals.tsx:593-599 |
| Appeals.tsx | Manual download:490 | ❌ No | GET | `download_url` | `http://localhost:8000${download_url}` | None | Appeals.tsx:488-490 |

### B) Backend Handler Mapping

| Router | Function (file:line) | Auth | Permission | OpenAPI OperationId | Request Schema Ref | Response Schema Ref |
|--------|---------------------|------|------------|-------------------|-------------------|-------------------|
| appeals | generate_appeals_packet (main.py:implied) | HTTPBearer | **appeal.read** | `generate_appeals_packet_api_appeals_generate_packet_post` | Generic object | Generic object |
| appeals | download_appeals_packet (main.py:implied) | HTTPBearer | None | `download_appeals_packet_api_appeals_download__packet_id__get` | None | Generic object |

### C) Contract Comparison

| Aspect | UI Expectation | Backend Spec | Evidence (file:line / OpenAPI ref) | Mismatch? |
|--------|---------------|--------------|-----------------------------------|-----------|
| Field names/types | `appeal_data`, `status`, `download_url` | Generic object | Appeals.tsx:307-309 vs OpenAPI | ❌ Unknown |
| Required/optional | Expects structured response | Generic object spec | Appeals.tsx:316+ vs OpenAPI | ❌ Yes |
| Content-Type | Expects JSON response | Generic object | Appeals.tsx:316 vs OpenAPI | ❌ Unknown |
| Status handling | Checks `result.status === 'success'` | Standard HTTP codes | Appeals.tsx:318 vs OpenAPI | ❌ Yes |
| Download handling | Uses hardcoded localhost:8000 | Server runs on 8001 | Appeals.tsx:490 vs Phase 1 findings | ❌ Yes |

### D) Known Break Points

| Break Point | Why It Fails | Evidence (file:line) | Severity (High/Med/Low) | Related Risk |
|------------|--------------|---------------------|----------------------|--------------|
| Wrong download port | Uses localhost:8000, server runs on 8001 | Appeals.tsx:490 | High | Phase 1 Risk #2 |
| Unauthenticated download | Manual download bypasses authenticatedRequest | Appeals.tsx:488-490 | High | Auth bypass |
| Missing certificate endpoint | `/api/appeals/generate-certificate-test` not in OpenAPI | Appeals.tsx:302 vs OpenAPI | High | Missing backend |

---

## Flow 4: Upload / Download / Export

### A) UI → API Call Trace

| UI Component | Handler (file:line) | Uses Helper? | Method | Path (as coded) | Final URL Resolution | Headers (Auth/CT) | Payload Builder (file:line) |
|--------------|---------------------|--------------|--------|-----------------|---------------------|-------------------|---------------------------|
| Filing.tsx | downloadPacket:176 | ✅ Yes | GET | `packet.download_url` | Relative path via authenticatedRequest | `Authorization: Bearer` | N/A (GET request) |
| reports.ts | unlockReport:65 | ✅ Yes | POST | `/api/reports/unlock` | `http://127.0.0.1:8001/api/reports/unlock` | `Authorization: Bearer` | reports.ts:67 |

### B) Backend Handler Mapping

| Router | Function (file:line) | Auth | Permission | OpenAPI OperationId | Request Schema Ref | Response Schema Ref |
|--------|---------------------|------|------------|-------------------|-------------------|-------------------|
| reports | **MISSING** | **N/A** | **N/A** | **NOT FOUND** | **N/A** | **N/A** |

### C) Contract Comparison

| Aspect | UI Expectation | Backend Spec | Evidence (file:line / OpenAPI ref) | Mismatch? |
|--------|---------------|--------------|-----------------------------------|-----------|
| Field names/types | `report_id`, `download_url` | **ENDPOINT MISSING** | reports.ts:67,77 vs OpenAPI | ❌ Yes |
| Required/optional | Expects unlock to return download_url | **ENDPOINT MISSING** | reports.ts:77 vs OpenAPI | ❌ Yes |
| Content-Type | Expects JSON | **ENDPOINT MISSING** | reports.ts:65 vs OpenAPI | ❌ Yes |

### D) Known Break Points

| Break Point | Why It Fails | Evidence (file:line) | Severity (High/Med/Low) | Related Risk |
|------------|--------------|---------------------|----------------------|--------------|
| Missing unlock endpoint | `/api/reports/unlock` not implemented | reports.ts:65 vs OpenAPI | High | Missing backend |

---

## Flow 5: Generate Monetizable Report (Create → Poll → Download)

### A) UI → API Call Trace

| UI Component | Handler (file:line) | Uses Helper? | Method | Path (as coded) | Final URL Resolution | Headers (Auth/CT) | Payload Builder (file:line) |
|--------------|---------------------|--------------|--------|-----------------|---------------------|-------------------|---------------------------|
| reports.ts | unlockReport:65 | ✅ Yes | POST | `/api/reports/unlock` | `http://127.0.0.1:8001/api/reports/unlock` | `Authorization: Bearer` | reports.ts:67 |
| reports.ts | downloadReport:102 | ✅ Yes | GET | `report.download_url` | Via authenticatedRequest | `Authorization: Bearer` | N/A (GET request) |

### B) Backend Handler Mapping

| Router | Function (file:line) | Auth | Permission | OpenAPI OperationId | Request Schema Ref | Response Schema Ref |
|--------|---------------------|------|------------|-------------------|-------------------|-------------------|
| reports | **UNLOCK MISSING** | **N/A** | **N/A** | **NOT FOUND** | **N/A** | **N/A** |
| reports | download_report (main.py:implied) | HTTPBearer | None | `download_report_api_reports_download__report_id__get` | None | Generic object |

### C) Contract Comparison

| Aspect | UI Expectation | Backend Spec | Evidence (file:line / OpenAPI ref) | Mismatch? |
|--------|---------------|--------------|-----------------------------------|-----------|
| Field names/types | `report_id`, `download_url` return | Generic object | reports.ts:77,107 vs OpenAPI | ❌ Yes |
| Required/optional | Unlock required before download | Download available without unlock | reports.ts:97-99 vs OpenAPI | ❌ Yes |
| Content-Type | Download expects blob | Generic object returned | reports.ts:107 vs OpenAPI | ❌ Yes |

### D) Known Break Points

| Break Point | Why It Fails | Evidence (file:line) | Severity (High/Med/Low) | Related Risk |
|------------|--------------|---------------------|----------------------|--------------|
| Missing unlock endpoint | No `/api/reports/unlock` implementation | reports.ts:65 vs OpenAPI | High | Missing backend |
| Content-type mismatch | Download expects blob, backend returns generic object | reports.ts:107 vs OpenAPI | High | Download failure |

---

## E) Calls Bypassing authenticatedRequest

| File:Line | Method | Path | Consequence | Suggested Target Helper |
|-----------|--------|------|-------------|------------------------|
| filing.ts:45 | GET | `/api/filing/packets` | Manual auth header, no token refresh | authenticatedRequest |
| Appeals.tsx:490 | GET | `download_url` | Wrong port + no auth | authenticatedRequest |
| Appeals 2.tsx:401,501 | GET | `download_url` | Wrong port + no auth | authenticatedRequest |

## F) Error Handling Observed

| UI Location (file:line) | How Errors Are Handled | Problem (if any) |
|-------------------------|------------------------|------------------|
| Portfolio.tsx:705-711 | toast() with validation errors | ✅ Good UX |
| Appeals.tsx:312-314,650-653 | toast() with error message | ✅ Good UX |
| lib/auth.ts:263,275 | console.log only | ❌ No user feedback |
| filing.ts:76,110,140,169 | console.error only | ❌ No user feedback |
| reports.ts:80-84 | console.error + set error state | ⚠️ Error state not displayed |

## G) Download/Upload Alignment

| Endpoint | Backend Content-Type | Frontend Handling | Filename/Disposition | Evidence (file:line) | Risk |
|----------|---------------------|-------------------|-------------------|-------------------|------|
| `/api/appeals/download/{packet_id}` | Unknown | `authenticatedRequest()` → blob | Unknown | Appeals.tsx:329 vs OpenAPI | High |
| `/api/reports/download/{report_id}` | Generic object | `response.blob()` | Unknown | reports.ts:107 vs OpenAPI | High |
| Manual download URLs | Unknown | Direct window.open | Unknown | Appeals.tsx:490 | High |

---

## Summary

**Phase 2 wiring matrix ready.**

**Highest-impact mismatches preventing click-through demo success:**

• **Missing `/api/reports/unlock` endpoint** - reports.ts:65 calls non-existent backend, breaking monetizable reports flow entirely

• **Wrong download port in Appeals.tsx:490** - hardcoded localhost:8000 when server runs on 8001, causing all manual downloads to fail

• **Property creation field mismatch** - UI sends `propertyType` but backend expects `property_type` (Portfolio.tsx:740 vs PropertyCreateRequest schema)

• **Missing certificate endpoint** - Appeals.tsx:302 calls `/api/appeals/generate-certificate-test` which doesn't exist in OpenAPI

• **Unauthenticated download bypasses** - Appeals.tsx:488-490 constructs URLs manually without using authenticatedRequest helper, bypassing auth