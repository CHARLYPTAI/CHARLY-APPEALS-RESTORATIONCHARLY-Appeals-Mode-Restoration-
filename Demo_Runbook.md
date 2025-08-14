# 🎬 CHARLY Demo Runbook - Swarz & Associates
**Phase 5.1: Live Demo Script - All Bucket A Issues Fixed**

---

## Pre-Demo Setup (2 minutes)

### 1. Start CHARLY Backend
```bash
cd ~/Desktop/CHARLY_TEST/fastapi_backend
python3 -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
**Wait for**: "Application startup complete" message  
**Verify**: http://127.0.0.1:8001/docs shows OpenAPI documentation

### 2. Demo Credentials  
- **Email**: admin@charly.com  
- **Password**: CharlyCTO2025!  
- **Token**: Auto-generated (24hr expiry)

### 3. Quick Health Check
```bash
curl -s http://127.0.0.1:8001/api/health | head -1
```
**Expected**: `{"status": "healthy"}`

---

## Flow 1: Create Property (2 minutes)

### Navigation & Login
1. **Open**: http://127.0.0.1:8001  
2. **Say**: "Let me log into CHARLY's property tax appeal platform"  
3. **Login**: Use admin@charly.com / CharlyCTO2025!  
4. **Expected**: Dashboard with portfolio overview loads

### Add New Property  
1. **Navigate**: Click "Portfolio" or "Add Property"  
2. **Say**: "I'll add a commercial property to demonstrate CHARLY's valuation capabilities"  
3. **Fill Sample Data**:
   - **Address**: 123 Main Street, Austin, TX 78701
   - **Property Type**: Standalone Retail *(UI labels map to backend enum automatically)*
   - **Current Assessment**: $1,200,000  
   - **Estimated Market Value**: $950,000  
   - **Square Footage**: 15000  
   - **Year Built**: 1995

4. **Submit**: Click "Add Property"  
5. **Success Cue**: Property appears in portfolio list  
6. **Say**: "Notice CHARLY immediately calculates the potential tax savings - in this case, the property appears over-assessed by $250,000"

### Property Type Crosswalk
**Note**: UI labels map to backend enum automatically:
- **"Standalone Retail" → Commercial**
- **"Restaurant / Bar" → Commercial** 
- **"Warehouse/Distribution" → Industrial**
- **"Mixed-Use (Resi over Retail)" → Mixed Use**

**Response Time**: 1-2 seconds  
**Recovery**: If form fails, refresh and re-enter data  

---

## Flow 2: Generate Property Workup (3 minutes)

### Initiate Valuation Analysis
1. **Click**: Property from portfolio list  
2. **Say**: "Now let's generate CHARLY's AI-powered valuation analysis"  
3. **Click**: "Generate Workup" or "Valuation Analysis"  
4. **Expected**: Progress indicator shows analysis running

### Review Generated Analysis  
1. **Wait**: 15-30 seconds for analysis completion  
2. **Say**: "CHARLY uses machine learning to analyze comparable properties, market trends, and assessment patterns"  
3. **Show**: Generated narrative sections:
   - Income approach analysis  
   - Sales comparison data  
   - Cost approach methodology  
4. **Highlight**: Key metrics and recommended appeal value

**Success Cues**: 
- Analysis completes without errors  
- Multiple valuation approaches displayed  
- Clear savings calculation shown

**Recovery**: If analysis fails, try "Refresh Analysis" button

---

## Flow 3: File Appeal (4 minutes)

### Generate Appeal Packet
1. **Click**: "File Appeal" from property detail  
2. **Say**: "CHARLY automatically generates professional appeal packets that meet county requirements"  
3. **Select**: Appeal packet type (comprehensive recommended)  
4. **Click**: "Generate Appeal Packet"  
5. **Expected**: Packet generation progress indicator

### Check Status & Download  
1. **Wait**: 30-60 seconds for packet generation  
2. **Click**: "Check Status" (shows in-progress → completed)  
3. **Say**: "The system uses authenticated downloads to ensure security"  
4. **Click**: "Download Packet" 
5. **Success Cue**: PDF downloads successfully (no 404 or connection errors)  

**Key Demo Points**:
- No hardcoded localhost:8000 errors (Fixed: I02)  
- Downloads require authentication (Fixed: I05)  
- All download URLs work correctly  

**Recovery**: If download fails, check browser network tab for errors

---

## Flow 4: Reports Unlock & Monetization (3 minutes)

### Generate Monetizable Report
1. **Navigate**: Reports section  
2. **Say**: "CHARLY offers premium reports that can be unlocked for detailed analysis"  
3. **Click**: "Generate Report" 
4. **Select**: Property analysis report type  
5. **Submit**: Report generation request

### Unlock Report (New Feature)  
1. **Note Report ID**: From generation response  
2. **Say**: "This demonstrates CHARLY's monetization capabilities"  
3. **API Call**: Show unlock endpoint working  
4. **Success Cue**: Report status changes to "unlocked"  
5. **Download**: Premium report PDF

**Technical Highlight**: 
- New `/api/reports/unlock` endpoint (Fixed: I01)  
- Proper permission validation  
- Secure download URLs provided  

**Recovery**: If unlock fails, verify user has reports.read permission

---

## Flow 5: Upload/Download/Export Sanity (2 minutes)

### Quick Validation Tests
1. **Upload**: Test document to property  
2. **Say**: "CHARLY handles all supporting documentation securely"  
3. **Export**: Portfolio to Excel/PDF  
4. **Download**: Verify export completes successfully  

### Certificate Generation (New)
1. **Click**: "Generate Certificate" (if available)  
2. **Expected**: Certificate generation endpoint responds (Fixed: I04)  
3. **Success Cue**: No 405 Method Not Allowed errors  

**Recovery**: If any upload/download fails, check network connectivity

---

## Demo Talking Points

### Opening (30 seconds)
*"CHARLY automates property tax appeals using AI and machine learning. What used to take weeks of manual work now takes minutes, with professional-grade results that meet county requirements."*

### Property Creation  
*"Notice how CHARLY immediately identifies over-assessment and calculates potential savings. The platform handles all property types and jurisdictions."*

### Valuation Analysis  
*"Our AI analyzes thousands of comparable properties, market trends, and assessment patterns to generate defensible valuations that hold up in appeals hearings."*

### Appeal Generation  
*"The system generates complete appeal packets with all required forms, supporting documentation, and compelling narratives - ready to file with the county."*

### Monetization  
*"CHARLY offers both standard and premium analysis tiers, with secure report unlocking and authenticated downloads for sensitive financial data."*

### Closing  
*"This end-to-end automation can reduce appeal preparation time by 90% while improving success rates through data-driven insights."*

---

## Technical Success Indicators

✅ **All Downloads Work**: No localhost:8000 connection errors  
✅ **Authentication Required**: Secure Bearer token validation  
✅ **Field Compatibility**: UI and backend communicate correctly  
✅ **New Endpoints Active**: Reports unlock and certificate generation  
✅ **No 404/405 Errors**: All called endpoints exist and respond  

---

## Quick Recovery Guide

| Issue | Check | Solution |
|-------|-------|----------|
| Login fails | Server running? | Restart: `python3 -m uvicorn main:app --port 8001` |
| Download 404 | URL correct? | Verify relative paths (no localhost:8000) |
| API 401 | Token valid? | Re-login to get fresh token |
| Form errors | Fields match? | Use exact sample data provided |
| 500 errors | Server logs? | Check console output for errors |

---

## Demo Metrics 

**Total Runtime**: 14-16 minutes  
**Key Flows**: 5 critical user journeys  
**Success Criteria**: All technical fixes validated in live demo  
**Backup Plan**: Phase4_Runtime_Proof.md shows curl-level validation if UI issues occur

---

## Appendix: Commit Information

**Demo Tag**: v0.9-demo  
**Base Commit**: ffaf53b (FINAL FIX: Completely disable ALL GitHub Actions workflows)

**Phase 5 Fixes Applied**:
- **I02**: Appeals.tsx, Appeals 2.tsx - localhost:8000 hardcoding removed  
- **I05**: Appeals 2.tsx - fetch() replaced with authenticatedRequest()  
- **I03**: Portfolio.tsx - field naming consistency improved  
- **I01**: reports_endpoints.py - /api/reports/unlock endpoint added  
- **I04**: appeals_endpoints.py - /api/appeals/generate-certificate-test endpoint added

**Rollback Commands** (if needed):
```bash
# Undo all fixes
git restore --source=HEAD -- charly_ui/src/pages/Appeals.tsx "charly_ui/src/pages/Appeals 2.tsx"
git restore --source=HEAD -- charly_ui/src/pages/Portfolio.tsx  
git restore --source=HEAD -- fastapi_backend/routes/reports_endpoints.py
git restore --source=HEAD -- fastapi_backend/routes/appeals_endpoints.py

---

## Phase C: Action Button Success Cues

### Supernova Report (Generate → Unlock → Download)
**Success Indicators**:
- Network: POST `/api/reports/generate` (200/202) → POST `/api/reports/unlock` (200) → GET `/api/reports/download/<id>` (200)
- Console: "✅ Supernova report downloaded: supernova_report_<property_id>.pdf"
- Toast: "🌟 Supernova Report Generated - Professional IAAO-compliant report for [address] downloaded successfully"
- File: PDF automatically downloads to browser's download folder

### Generate Appeal (Generate → Status Poll → Download)  
**Success Indicators**:
- Network: POST `/api/appeals/generate-packet` (200) → multiple GET `/api/appeals/packet-status/<id>` → GET `/api/appeals/download/<id>` (200)
- Console: "✅ Appeal packet downloaded: appeal_packet_<property_id>.pdf"
- Toast: "Appeal Packet Complete - Professional appeal packet for [address] generated and downloaded successfully"
- File: PDF automatically downloads to browser's download folder

### Finalize Valuation (Submit to Filing)
**Success Indicators**:
- Network: POST `/api/filing/electronic-submit` (200)
- Console: "✅ Valuation finalized and submitted: {filingId: '...', status: 'submitted'}"
- Toast: "✅ Valuation Finalized - Valuation submitted successfully. Filing ID: [filing_id]"
- UI: Button changes to "Submitted" (gray, disabled)
```