# SWARTZ Test Dataset

## Don Swartz Properties - Pilot E2E Validation Dataset

This directory contains test property data files for validating the T-002 Commercial Customer Onboarding process.

### Test Files:
- `Income Statement 123 company.pdf` - Company income statement for commercial property
- `Office Bldg Z – 2020, 2021, 2022 income statements.pdf` - Multi-year income statements 
- `P&L ABC Company 2021 & 2022.pdf` - Profit & Loss statements for validation
- `Rent Roll as of 12.31.22 Office Bldg Z.pdf` - Rent roll data for property analysis

### Validation Goals:
1. **File Ingestion Security**: AV scan, EXIF scrub, schema validation
2. **Jurisdiction Rules**: Proper application of local tax assessment rules
3. **Decision Engine**: Over/Fair/Under assessment determination
4. **KPI Tracking**: Performance metrics during onboarding
5. **Performance**: Processing speed and accuracy

### Expected Outcomes:
- ✅ Files pass security validation (AV scan, EXIF scrub)
- ✅ Schema validation confirms proper data extraction
- ✅ Jurisdiction rules applied correctly per property location
- ✅ KPIs tracked throughout onboarding process
- ✅ Decision engine produces accurate over-assessment detection

Generated for CHARLY platform T-002 validation testing.