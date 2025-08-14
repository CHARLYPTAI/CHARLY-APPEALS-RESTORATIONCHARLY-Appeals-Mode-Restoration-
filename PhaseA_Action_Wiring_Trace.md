# Phase A: Action Wiring Trace Report

## Current Handler Locations & Data Sources

### Row Map Site
- **File**: `/Users/georgewohlleb/Desktop/CHARLY_TEST/charly_ui/src/pages/Portfolio.tsx` (29,425+ lines)
- **Location**: Lines ~2060-2340 (Action Buttons section)

### onClick Handlers Analysis

#### 1. Supernova Report Handler
- **Location**: Portfolio.tsx:2152-2340
- **Pattern**: Direct inline onClick handler with async function
- **Key Issues Found**:
  - Line 2156: `console.log('🔍 Selected property ID:', selectedPropertyId);` - logs `null`
  - Line 2174: Pre-check blocks API call: `if (!currentProperty.address || !currentProperty.propertyType)`
  - Uses `currentProperty` variable but `selectedPropertyId` is null

#### 2. Generate Appeal Handler  
- **Location**: Portfolio.tsx:2063-2110
- **Pattern**: Direct inline onClick handler with async function
- **Key Issues Found**:
  - Line 2072: Makes API call to `/api/appeals/generate-packet`
  - Payload includes `property_data: currentProperty` but missing `property_id`
  - Lines 2077-2083: Sends property_address, jurisdiction, etc. but NOT property_id

#### 3. Finalize Handler
- **Location**: ValuationTabs.tsx:177 (handleFinalize)
- **Status**: Found reference but need to investigate actual implementation

### Property ID Sources
- **Selected Property**: `selectedPropertyId` state variable (appears to be null)
- **Current Property**: `currentProperty` object (contains property data but ID might be missing)
- **Properties List**: `properties` array (contains property records)

## API Ground Truth (from OpenAPI spec)

### Reports Endpoints
```json
POST /api/reports/generate
- Expected payload: {"property_id": "<id>", "report_type": "supernova"}
- Response: {"report_id": "<id>", "status": "generating", "download_url": "/api/reports/download/<id>"}

POST /api/reports/unlock  
- Expected payload: {"report_id": "<id>"}
- Response: {"report_id": "<id>", "status": "unlocked", "download_url": "/api/reports/download/<id>"}

GET /api/reports/download/{report_id}
- Returns: FileResponse with PDF
```

### Appeals Endpoints
```json
POST /api/appeals/generate-packet
- Expected payload: {"property_id": "<id>"}
- Response: {"packet_id": "<id>", "status": "generating", "download_url": "/api/appeals/download/<id>"}

GET /api/appeals/packet-status/{packet_id}
- Response: {"packet_id": "<id>", "status": "ready|pending|error"}

GET /api/appeals/download/{packet_id}  
- Returns: FileResponse with PDF
```

## Runtime Issues Identified

### Problem 1: Property ID Binding
- **Root Cause**: `selectedPropertyId` is null when buttons are clicked
- **Evidence**: Console log shows "🔍 Selected property ID: null"
- **Impact**: API calls fail or never happen due to pre-checks

### Problem 2: Property Type Pre-check  
- **Root Cause**: `currentProperty.propertyType` is null/undefined
- **Evidence**: Error "Property address and type are required for report generation"
- **Impact**: Supernova handler aborts before making API call

### Problem 3: API Contract Mismatch
- **Appeal Handler**: Sends `property_address`, `jurisdiction` etc. but API expects `property_id`
- **Supernova Handler**: Never reaches API call due to pre-check failure

## Property Type Crosswalk System
- **File**: `charly_ui/src/config/property_type_crosswalk.ts`
- **Function**: `mapPropertyTypeLabelToBackend(label?: string): BackendClass`
- **Purpose**: Maps UI labels to backend enums (Commercial, Residential, Industrial, etc.)
- **Default**: Returns 'Commercial' for undefined/null inputs

## Next Steps (Phase B)
1. **B1**: Fix property ID binding - ensure buttons get valid property IDs
2. **B2**: Normalize type fields using crosswalk system to prevent pre-check failures
3. **Runtime Testing**: Verify fixes with actual API calls

## Files to Modify
- `charly_ui/src/pages/Portfolio.tsx` (main action handlers)
- May need to check ValuationTabs.tsx for Finalize handler

## Rollback Commands Ready
```bash
git restore --source=HEAD -- charly_ui/src/pages/Portfolio.tsx
git restore --source=HEAD -- charly_ui/src/components/ValuationTabs.tsx
```