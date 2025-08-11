# Phase 1 — Environment & Config Sanity Report

**Generated:** August 11, 2025  
**Repo Root:** ~/Desktop/CHARLY_TEST  
**Frontend:** charly_ui (React 18, TS, Vite)  
**Backend:** fastapi_backend (FastAPI, Pydantic v2)  

## 1) JWT & Auth Config Single-Source-of-Truth

| Item | Value | File:Line(s) | Notes |
|------|-------|--------------|-------|
| SECRET_KEY | `os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))` | fastapi_backend/core/auth.py:25 | **RISK**: Fallback generates new random secret per process restart |
| ALGORITHM | `os.getenv("JWT_ALGORITHM", "HS256")` | fastapi_backend/core/auth.py:26 | authoritative |
| ACCESS_TOKEN_EXPIRE_MINUTES | `int(os.getenv("JWT_EXPIRATION_HOURS", "24"))` | fastapi_backend/core/auth.py:27 | Note: stored as hours, not minutes |
| REFRESH_TOKEN_EXPIRE_MINUTES | `int(os.getenv("REFRESH_TOKEN_EXPIRATION_DAYS", "30"))` | fastapi_backend/core/auth.py:28 | Note: stored as days, not minutes |
| Bearer header usage | `Authorization: Bearer <token>` | fastapi_backend/core/auth.py:security | HTTPBearer(auto_error=False) |
| Token storage (frontend) | `localStorage` | charly_ui/src/security/AuthenticationManager.ts:73-74, charly_ui/src/lib/encryption.ts:198-199 | Multiple keys: `charly_auth_tokens`, `charly_refresh_token`, `access_token`, `refresh_token` |
| Token decode/verify site | `verify_token()` | fastapi_backend/core/auth.py:182-186 | Uses `jwt.decode()` with same SECRET_KEY |

## 2A) Frontend API Base URL & Transport

| Setting | Value | File:Line(s) | Notes |
|---------|-------|--------------|-------|
| Base URL (axios/fetch) | `http://127.0.0.1:8001` | charly_ui/src/lib/auth.ts:87,266, charly_ui/src/lib/env.ts:34 | **RISK**: hardcoded, not relative |
| Auth header injection | `Authorization: Bearer ${token}` | charly_ui/src/lib/auth.ts:256-283 | via `authenticatedRequest()` |
| Default Content-Type | `application/json` | charly_ui/src/store/filing.ts:44, charly_ui/src/store/valuation.ts:562, etc | consistent across stores |
| Global error handler | console.log only | charly_ui/src/lib/auth.ts:263,275 | **RISK**: no user-facing error handling |

## 2B) Calls bypassing authenticatedRequest

| File:Line(s) | Method | Path | Why it bypasses | Risk |
|--------------|--------|------|------------------|------|
| charly_ui/src/store/filing.ts:45 | GET | `/api/filing/packets` | Uses raw `fetch()` with manual auth header | Token not auto-refreshed |
| charly_ui/src/pages/Appeals.tsx:490 | GET | download_url | Hardcoded `http://localhost:8000` prefix | Wrong port (8000 vs 8001) |
| charly_ui/src/pages/Appeals 2.tsx:401,501 | GET | download_url | Hardcoded `http://localhost:8000` prefix | Wrong port (8000 vs 8001) |

## 3) Token Persistence & Session Stability

| Concern | Impl Details | File:Line(s) | Risk/Notes |
|---------|--------------|--------------|------------|
| Storage keys used | `charly_auth_tokens`, `charly_refresh_token`, `access_token`, `refresh_token` | charly_ui/src/security/AuthenticationManager.ts:73-74, charly_ui/src/lib/encryption.ts:198-199 | **RISK**: Multiple inconsistent keys |
| Expiry handling | Manual JWT decode check | charly_ui/src/lib/auth.ts:jwtDecode | No auto-refresh flow visible |
| Refresh flow | Present but limited | fastapi_backend/core/auth.py:350,367 | Backend supports it |
| Logout clears keys | Yes, multiple calls | charly_ui/src/security/AuthenticationManager.ts:461-463 | Clears all known keys |

## 4) DB/Data Persistence Expectations (Demo Safety)

| Setting | Value | File:Line(s) | Notes |
|---------|-------|--------------|-------|
| DB engine | SQLite | fastapi_backend/core/database.py:23-24 | Authoritative |
| DB path/DSN | `sqlite:///./charly_dev.db` (default) | fastapi_backend/core/database.py:23 | File exists at repo root |
| Seed/fixtures | Auto-created tables in init_database() | fastapi_backend/core/database.py:43-50 | **PASS**: survives restart |
| Auto-migrate on boot | Table creation only, no DROP | fastapi_backend/core/database.py:46-50 | **SAFE**: no wipe risk |

## 5) Duplicate/Shadow Config & Route Drift (Sanity)

| Duplicate/Shadow | File | Imported by Active App? | Drift Risk |
|------------------|------|------------------------|------------|
| Environment files | `.env`, `.env.example`, `.env.production.template` | `.env` by load_dotenv() | **LOW**: examples not loaded |
| Backend main files | `main.py`, `main 2.py`, `main_original_backup.py`, `main_refactored.py` | Only `main.py` | **MEDIUM**: backup files have different router configs |
| Route duplicates | `appeals_endpoints 2.py`, `payments 2.py`, `portfolio_router 2.py`, `usage 2.py` | **NO** - space-numbered files not imported | **LOW**: shadow files not loaded |
| Frontend auth files | `auth.ts`, `auth 2.ts`, `auth.ts.backup.1753748000` | Only `auth.ts` | **LOW**: backups not imported |

## 6) Upload/Download Content-Type Alignment (Quick Sanity)

| Endpoint | Backend Content-Type | Frontend Handling | File:Line(s) | Risk |
|----------|---------------------|-------------------|--------------|------|
| `/api/appeals/download/{packet_id}` | Unknown – not found | `authenticatedRequest()` → blob | charly_ui/src/pages/Appeals.tsx:327 | **MEDIUM**: content-type not validated |
| `/api/reports/download/{report_id}` | Unknown – not found | `response.blob()` | charly_ui/src/store/reports.ts:107-108 | **MEDIUM**: content-type not validated |
| Download URLs (manual) | Unknown – not found | Hardcoded localhost:8000 links | charly_ui/src/pages/Appeals.tsx:490 | **HIGH**: wrong port + no auth |

---

## Summary

**Phase 1 report ready.**

**Top three risks that could break the demo:**

1. **JWT secret regeneration on restart** - fallback `secrets.token_urlsafe(32)` in auth.py:25 will invalidate all tokens when server restarts without JWT_SECRET_KEY env var.

2. **Hardcoded localhost:8000 download URLs** - Appeals.tsx:490 and Appeals 2.tsx:401 use wrong port (8000 vs 8001) causing download failures.

3. **Multiple inconsistent token storage keys** - frontend uses at least 4 different localStorage keys for tokens creating potential auth state confusion.