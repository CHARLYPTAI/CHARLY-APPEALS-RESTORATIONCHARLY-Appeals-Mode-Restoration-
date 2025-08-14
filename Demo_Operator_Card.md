# CHARLY Demo Operator Card v0.9.1-demo-lock

**Server**: http://127.0.0.1:8001 | **Auth**: HTTP Bearer | **Tag**: v0.9.1-demo-lock

## Quick Start
```bash
./start_demo.sh    # Starts backend + health check, outputs demo URL
./stop_demo.sh     # Clean shutdown
./reset_demo_data.sh  # Reset to clean state (if needed)
./final_smoke.sh   # Verify all systems
```

## Demo Login
- **Admin**: `admin@charly.com` / `CharlyCTO2025!`
- **Test User**: Create via registration or use existing tokens from smoke tests

## Five Demo Flows

### 1. Authentication & Dashboard
- **Action**: Login → View KPIs dashboard
- **Talking Point**: "Enterprise-grade JWT auth with role-based permissions"
- **Success**: KPIs show 3 properties, $70K potential savings, health indicators green

### 2. Portfolio Management
- **Action**: Browse properties → Apply filters (type: Commercial, value: $400K-$600K)
- **Talking Point**: "Advanced multi-filter search with real-time results"
- **Success**: Returns filtered properties with market values in range

### 3. AI-Powered Valuation
- **Action**: Select property → View valuation analysis → Generate narrative
- **Talking Point**: "IAAO-compliant AI analysis with success probability scoring"
- **Success**: Shows valuation details, savings potential, and generated narrative

### 4. Appeals Packet Generation
- **Action**: Generate appeal packet → Download PDF
- **Talking Point**: "Professional-grade documents with legal compliance built-in"
- **Success**: PDF downloads with case analysis and supporting documentation

### 5. Reports & Analytics
- **Action**: Generate reports → View analytics dashboard
- **Talking Point**: "Comprehensive reporting with export capabilities"
- **Success**: Report generation status updates, analytics show usage metrics

## Recovery Commands
```bash
# 401 Unauthorized - Get fresh token
curl -X POST http://127.0.0.1:8001/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@charly.com","password":"CharlyCTO2025!"}'

# 404 Not Found - Verify server health
curl http://127.0.0.1:8001/api/health

# Slow Response - Check server logs
tail -f fastapi_backend/logs/server.foreground.log

# Emergency Reset
./stop_demo.sh && ./reset_demo_data.sh && ./start_demo.sh
```

## Success Indicators
- ✅ All endpoints return HTTP 200/201 (not 401/500)
- ✅ Demo data loads (3 properties visible)
- ✅ AI responses within 3 seconds
- ✅ PDF generation completes successfully
- ✅ Authentication flows work end-to-end

**Demo Duration**: 10-15 minutes | **Audience**: C-level executives, property tax professionals