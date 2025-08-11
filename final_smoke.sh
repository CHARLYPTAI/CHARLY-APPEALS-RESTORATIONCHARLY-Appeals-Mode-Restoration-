#!/bin/bash
# CHARLY Final Smoke Test v0.9.1-demo-lock
# Re-runs key curl checks and reports PASS/FAIL

set -e  # Exit on error

echo "🔍 CHARLY Final Smoke Test v0.9.1-demo-lock"
echo "================================================"

PASS=0
FAIL=0
BASE_URL="http://127.0.0.1:8001"

# Helper function for test results
check_result() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    printf "%-40s" "  $test_name:"
    
    if [[ "$actual" == *"$expected"* ]]; then
        echo "PASS ✅"
        ((PASS++))
    else
        echo "FAIL ❌"
        echo "    Expected: $expected"
        echo "    Actual: $actual"
        ((FAIL++))
    fi
}

# Test 1: Server Health Check
echo ""
echo "🏥 Health Checks"
echo "----------------"

HEALTH_RESULT=$(curl -s $BASE_URL/api/health || echo "ERROR")
check_result "Server Health" "healthy" "$HEALTH_RESULT"

AUTH_HEALTH=$(curl -s $BASE_URL/api/auth/health || echo "ERROR")
check_result "Auth Health" "demo_user" "$AUTH_HEALTH"

PORTFOLIO_HEALTH=$(curl -s $BASE_URL/api/portfolio/health || echo "ERROR")
check_result "Portfolio Health" "healthy" "$PORTFOLIO_HEALTH"

# Test 2: Authentication Flow
echo ""
echo "🔐 Authentication Tests"
echo "----------------------"

# Test login with demo credentials
LOGIN_RESULT=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@charly.com","password":"CharlyCTO2025!"}' || echo "ERROR")

if [[ "$LOGIN_RESULT" == *"access_token"* ]]; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    check_result "Demo Login" "access_token" "$LOGIN_RESULT"
else
    ACCESS_TOKEN=""
    check_result "Demo Login" "access_token" "$LOGIN_RESULT"
fi

# Test unauthorized access
UNAUTH_RESULT=$(curl -s -w "%{http_code}" $BASE_URL/api/portfolio/ || echo "ERROR")
check_result "Unauthorized Access Block" "401" "$UNAUTH_RESULT"

# Test 3: Core API Endpoints (with auth)
echo ""
echo "📡 API Endpoint Tests"
echo "--------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"
    
    # Test KPIs endpoint
    KPIS_RESULT=$(curl -s -H "$AUTH_HEADER" $BASE_URL/api/kpis || echo "ERROR")
    check_result "KPIs Endpoint" "total_properties" "$KPIS_RESULT"
    
    # Test portfolio summary
    PORTFOLIO_SUMMARY=$(curl -s -H "$AUTH_HEADER" $BASE_URL/api/portfolio/summary || echo "ERROR")
    check_result "Portfolio Summary" "total_properties" "$PORTFOLIO_SUMMARY"
    
    # Test enhanced search (Phase 6 fix)
    SEARCH_RESULT=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/api/portfolio/search?type=Commercial&min_value=300000" || echo "ERROR")
    check_result "Enhanced Search Filter" "Commercial" "$SEARCH_RESULT"
    
    # Test AI prediction endpoint
    AI_RESULT=$(curl -s -H "$AUTH_HEADER" -X POST $BASE_URL/api/ai/predict \
      -H "Content-Type: application/json" \
      -d '{"properties":[{"address":"Test","market_value":500000}]}' || echo "ERROR")
    check_result "AI Prediction" "predictions" "$AI_RESULT"
    
else
    echo "  ⚠️  Skipping authenticated tests - no access token"
    ((FAIL += 4))
fi

# Test 4: Document Generation
echo ""
echo "📄 Document Generation Tests"
echo "----------------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    # Test appeal packet generation
    PACKET_RESULT=$(curl -s -H "$AUTH_HEADER" -X POST $BASE_URL/api/appeals/generate-packet-simple \
      -H "Content-Type: application/json" \
      -d '{"property_address":"123 Test St","assessment_value":500000}' || echo "ERROR")
    check_result "Appeal Packet Generation" "packet_id" "$PACKET_RESULT"
    
    # Test report generation
    REPORT_RESULT=$(curl -s -H "$AUTH_HEADER" -X POST $BASE_URL/api/reports/generate \
      -H "Content-Type: application/json" \
      -d '{"type":"property_analysis","property_ids":["test"]}' || echo "ERROR")
    check_result "Report Generation" "report_id" "$REPORT_RESULT"
else
    echo "  ⚠️  Skipping document tests - no access token"
    ((FAIL += 2))
fi

# Test 5: Error Handling
echo ""
echo "⚠️  Error Handling Tests"
echo "-----------------------"

# Test 404 handling
NOT_FOUND=$(curl -s -w "%{http_code}" $BASE_URL/api/nonexistent || echo "ERROR")
check_result "404 Error Handling" "404" "$NOT_FOUND"

# Test malformed JSON handling  
BAD_JSON=$(curl -s -w "%{http_code}" -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{invalid json}' || echo "ERROR")
check_result "Bad JSON Handling" "422" "$BAD_JSON"

# Final Results
echo ""
echo "📊 SMOKE TEST RESULTS"
echo "======================"
echo "PASSED: $PASS"
echo "FAILED: $FAIL"
echo "TOTAL:  $((PASS + FAIL))"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED - DEMO READY ✅"
    exit 0
else
    echo ""
    echo "💥 $FAIL TESTS FAILED - DEMO NOT READY ❌"
    exit 1
fi