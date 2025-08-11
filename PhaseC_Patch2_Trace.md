# Phase C Patch 2 - Active Handler Trace

## Summary
Based on runtime evidence and code search, the active handlers are located in `/pages/Portfolio.tsx`, not the PropertyAnalysisModal component.

## Active Handler Locations

| Search String | File:Line | Handler Type |
|---------------|-----------|--------------|
| `🌟 Supernova button clicked` | Portfolio.tsx:2240 | Supernova Report Button |
| `Selected property ID:` | Portfolio.tsx:2243 | Debug logging (shows null issue) |
| `Generating appeal packet for:` | Portfolio.tsx:2076 | Appeal Generation Button |
| `/api/appeals/generate-packet` | Portfolio.tsx:2083 | Appeal API call |
| `Property address and type are required...` | PropertyAnalysisModal.tsx:382 | NOT ACTIVE (unused modal) |

## Current Active Route
- **Route**: `/portfolio` 
- **Component**: `charly_ui/src/pages/Portfolio.tsx`
- **Active Buttons**:
  - Supernova: Portfolio.tsx:2235-2300+ (approx)
  - Appeals: Portfolio.tsx:2070-2150+ (approx)

## Key Issues Identified
1. **Appeals payload**: Lines 2088-2100 send wrong structure (property_data object instead of just property_id)
2. **Supernova validation**: Line 2262 only checks address, not type requirement 
3. **selectedPropertyId null**: Line 2243 logs show null selectedPropertyId (not used in current handlers)

## Next Steps
The actual fixes need to target Portfolio.tsx, not PropertyAnalysisModal.tsx.