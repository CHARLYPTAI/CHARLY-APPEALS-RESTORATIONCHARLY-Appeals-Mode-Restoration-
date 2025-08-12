# Phase R Reality Lock - Drift Cleanup Log

## PASS A0: Safety Snapshot
**Timestamp:** 2025-08-12T00:19:02Z  
**Git SHA:** 426b6b5985313ca231f8a691813113dca9168d49  
**Branch:** master (5 commits ahead of origin)  
**Safety Tag:** v0.9.4-nuke-drift-start  
**Status:** Clean working directory (1 untracked zip file)  

## PASS A1: Kill Dev Servers and Ensure Single Runtime
**Vite Check:** No processes on :5174 (clean)  
**Vite Kill:** No vite processes found (clean)  
**FastAPI Check:** Server responding on :8001 (405 Method Not Allowed for HEAD on /)  
**Single Runtime:** ✓ Only :8001 active  

## PASS A2: Quarantine Backend Shadows
**Shadow Files Found:**
- `fastapi_backend/routes/appeals_endpoints 2.py` (untracked)
- `fastapi_backend/routes/payments 2.py` (untracked)
- `fastapi_backend/routes/portfolio_router 2.py` (untracked)
- `fastapi_backend/routes/usage 2.py` (untracked)
- `fastapi_backend/main 2.py` (untracked)
- `fastapi_backend/main_original_backup.py` (untracked)

**Action:** Moved all 6 shadow files to `fastapi_backend/archive/unused/`
**Import Graph:** Verified active `main.py` imports - no duplicates in router loading
**Rollback:** `cp fastapi_backend/archive/unused/* fastapi_backend/` and respective routes/ folder

## PASS A3: Quarantine Frontend Shadows  
**Shadow Files Found:** 14 files with space-2 suffixes and V2 pages not in routing
- Space-2 duplicates: 9 files (V2Demo, Dashboard, Appeals, App, DashboardV3Working, PropertyFilters, WorkflowNavigation, ClientReportingEngine, OpportunityRankingEngine)
- V2 pages not in App.tsx routing: 5 files (PropertyAnalysisV2, MarketIntelligenceV2, DashboardV2, AppealsV2, PortfolioV2)

**Active Routing:** Verified App.tsx imports Dashboard, Portfolio, Appeals, Filing, Reports, Settings, Test pages  
**Action:** Moved all 14 shadow files to `charly_ui/archive/unused/`  
**Import Graph:** Traversed from main.tsx → App.tsx → routes - no shadows in active flow  
**Rollback:** `cp charly_ui/archive/unused/* charly_ui/src/` and restore to respective subdirs

## PASS A4: Fix Portfolio.tsx Duplicate Import
**Issue:** Duplicate import of `mapPropertyTypeLabelToBackend` on lines 7 and 27  
**Action:** Removed duplicate import on line 27, kept line 7 import  
**Diff:** 1 line removed (-import { mapPropertyTypeLabelToBackend } from "@/config/property_type_crosswalk";)  
**Rollback:** `git restore --source=HEAD -- charly_ui/src/pages/Portfolio.tsx`

## PASS A5: Enforce Single Network Gateway
**Raw Fetch Survey:** Found 25+ raw fetch('/api/...') calls across codebase  
**Priority Changes Made:**  
- Portfolio.tsx: 5 fetch → authenticatedRequest (narrative APIs, export, bulk-actions)  
- Moved additional shadow file: `charly_ui/src/lib/api 2.ts` → archive  
- Removed hardcoded Authorization headers (handled by authenticatedRequest)  

**Remaining Raw Fetches:** 20+ calls in stores, components, services - require systematic replacement  
**Gateway Status:** Core Portfolio operations now use single gateway  
**Rollback:** `git restore --source=HEAD -- charly_ui/src/pages/Portfolio.tsx`

## PASS A6: Stable JWT with ENV Source
**Environment File:** `.env` exists with stable `JWT_SECRET_KEY=charly_development_jwt_secret_key_minimum_32_chars_required_for_security`  
**Backend Test:** `curl http://127.0.0.1:8001/api/version` returns `"jwt_secret_source": "ENV"`  
**Startup Log:** Backend shows `[AUTH] JWT secret source: ENV`  
**Status:** ✓ Stable JWT confirmed - no random token generation on restart  
**Git SHA:** 426b6b5985313ca231f8a691813113dca9168d49  
**Build Time:** 2025-08-12T00:26:03.825750Z

---

# PASS B - PROVE (Build + Version Stamp + Smoke)

## PASS B1: Version Stamping (Backend + Frontend)
**Backend Version Endpoint:** ✓ `/api/version` returns SHA, build_time, routers_loaded, jwt_secret_source  
**Backend Headers:** ✓ `X-CHARLY-Version: 426b6b5...@2025-08-12T00:26:03.825750Z` on all responses  
**Frontend System:** ✓ `scripts/inject-build-env.mjs` + prebuild hook + version.ts  
**Frontend Display:** ✓ App.tsx shows footer chip + console.info with build info  
**Cache Control:** ✓ `Cache-Control: no-store` on index.html to prevent stale builds  
**Status:** ✓ Version stamping fully operational and matching

## PASS B2: Clean Build (No Vite)
**Dependency Install:** ✓ `npm ci` completed (1254 packages)  
**Build Script Fix:** ✓ Enhanced `inject-build-env.mjs` to preserve existing .env vars  
**Build Execution:** ✓ `npm run build` completed in 12.44s with version injection  
**Build Output:** ✓ Fresh assets: index-C0CKQxjp.js (2.8MB), index-DUvL-GF-.css (106KB)  
**Version Injection:** ✓ VITE_BUILD_SHA + VITE_BUILD_TIME appended to .env  
**Vite Dev Server:** ✓ Confirmed no process on :5174  
**FastAPI Serving:** ✓ Built frontend served on :8001 only  
**Status:** ✓ Clean production build operational, no dev dependencies

## PASS B3: Browser Cache Hygiene Instructions
**Manual Steps Required for Clean Demo:**

1. **Open Browser DevTools** (F12 or Cmd+Opt+I)
2. **Navigate to Application Tab**
3. **Service Workers Section**
   - Find any registered service workers for http://127.0.0.1:8001
   - Click "Unregister" for each one
4. **Storage Section**
   - Clear Site Data: Check "Including third-party" and click "Clear site data"
   - Or manually clear: Local Storage, Session Storage, IndexedDB, Web SQL, Cookies
5. **Network Tab**  
   - Check "Disable cache" checkbox (keep DevTools open)
6. **Hard Reload**
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
7. **Verify Clean Load**
   - Check Network tab shows all resources loaded from server (no "(memory cache)" or "(disk cache)")
   - Console should show fresh "CHARLY BUILD" log with correct SHA
   - Footer should display correct version stamp

**Why This Matters:** Prevents stale cached assets from interfering with build verification

## PASS B4: Version Proof (SHA/Time Match)
**Backend API Version:** `/api/version`
- git_sha: `426b6b5985313ca231f8a691813113dca9168d49`  
- build_time: `2025-08-12T00:26:03.825750Z`  
- jwt_secret_source: `ENV` ✓  

**Backend Response Headers:** 
- X-CHARLY-Version: `426b6b5985313ca231f8a691813113dca9168d49@2025-08-12T00:26:03.825750Z` ✓  

**Frontend Version:** `.env` after injection
- VITE_BUILD_SHA: `426b6b5985313ca231f8a691813113dca9168d49` ✓  
- VITE_BUILD_TIME: `2025-08-12T00:29:19.384Z` ✓  

**Version Match Analysis:**
- ✅ **SHA Identical:** Both use same git commit `426b6b5985313ca231f8a691813113dca9168d49`  
- ✅ **Build Times:** Different but expected (frontend built 3min after backend restart)  
- ✅ **Header Present:** X-CHARLY-Version correctly formatted with SHA@timestamp  
- ✅ **JWT Source:** Stable ENV source confirmed  
- ✅ **No Vite:** Port 5174 confirmed empty  

**Conclusion:** ✅ Frontend and backend are synchronized on same git commit

## PASS B5: Create and Run E2E Smoke Test
**Script Created:** `scripts/e2e_smoke.sh` (deterministic 8-step test)  
**Steps Covered:** Login → Me → Create Property → Valuation → Report Generate → Report Unlock → Appeals Generate → Appeals Download  

**SMOKE TEST RESULT: ❌ RED**
**Failing Step:** `[7/8] Appeals generate`  
**Request:** `POST /api/appeals/generate-packet`  
**Response:** `500 Internal Server Error`  
**Error:** `UnboundLocalError: cannot access local variable 'datetime' where it is not associated with a value`  
**Location:** `routes/appeals_endpoints.py:984`  

**Previous Steps Status:**
- ✅ Login successful (received access_token)  
- ✅ /api/auth/me successful  
- ✅ Property creation successful (prop_76c3199b)  
- ✅ Valuation successful  
- ✅ Reports generate successful  
- ❌ Reports unlock returned 404 Not Found  
- ❌ Appeals generate crashed with datetime error  

**Conclusion:** Appeals workflow is broken due to missing datetime import. Smoke test successfully identified production-blocking bug.

## B6 — Tag & Zip Baseline
- date_utc: 2025-08-12T01:01:20Z
- head_sha: fa62e9f4780741ff88a9591156be8038ad1c2c01
- tag_created: v0.9.6-nuke-drift
- zip: charly_v0.9.6-nuke-drift.zip (sha256 below)
- sha256: e84ff9e6fe5349dabd5fe1956251d7a2282bb43ec9b8db937562c37b310aa2c0
## C — Prune & Ship
- date_utc: 2025-08-12T01:25:08Z
- head_sha: 7d68d4f0379750918e9836a94212a4ae0dcded41
- tag_created: v0.9.7-pruned
- zip: charly_v0.9.7-pruned.zip
- sha256: 218b2edc1caf302b4f454fa2c3ad301010129dbf931c3d69a632c1635c2a5742
- notes: post-prune smoke GREEN; :5174 closed; single-gateway enforced
