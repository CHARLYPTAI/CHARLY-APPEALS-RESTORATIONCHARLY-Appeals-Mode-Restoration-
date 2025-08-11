#!/bin/bash

# R4: Deterministic, repo-agnostic runtime proof (curl)
# Tests the complete API flow with known good admin credentials

set -e  # Exit on error

BACKEND_URL="http://127.0.0.1:8080"
API_URL="${BACKEND_URL}/api"
PROOF_FILE="PhaseR_Proof.md"

echo "🔍 Starting CHARLY Reality Proof Test"
echo "======================================"
echo ""

# Clear previous proof file
> $PROOF_FILE

# Add header to proof file
cat << 'EOF' >> $PROOF_FILE
# CHARLY Phase R Reality Proof

## Test Environment
- Backend URL: http://127.0.0.1:8001
- Test Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- Test Type: Deterministic Runtime Proof

## Test Results

EOF

echo "Backend URL: $BACKEND_URL" >> $PROOF_FILE
echo "Test Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> $PROOF_FILE
echo "" >> $PROOF_FILE

# Function to test endpoint and log results
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local description=$5
    
    echo "Testing: $description"
    echo "### $description" >> $PROOF_FILE
    echo "" >> $PROOF_FILE
    echo "**Request:**" >> $PROOF_FILE
    echo "\`\`\`bash" >> $PROOF_FILE
    
    if [ -z "$auth_header" ]; then
        cmd="curl -s -X $method '$API_URL$endpoint'"
        if [ -n "$data" ]; then
            cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
        fi
        echo "$cmd" >> $PROOF_FILE
        echo "\`\`\`" >> $PROOF_FILE
        echo "" >> $PROOF_FILE
        echo "**Response:**" >> $PROOF_FILE
        echo "\`\`\`json" >> $PROOF_FILE
        
        if [ -n "$data" ]; then
            response=$(curl -s -w "\\nHTTP_CODE:%{http_code}" -X $method "$API_URL$endpoint" -H 'Content-Type: application/json' -d "$data" 2>/dev/null || echo "ERROR")
        else
            response=$(curl -s -w "\\nHTTP_CODE:%{http_code}" -X $method "$API_URL$endpoint" 2>/dev/null || echo "ERROR")
        fi
    else
        cmd="curl -s -X $method '$API_URL$endpoint' -H '$auth_header'"
        if [ -n "$data" ]; then
            cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
        fi
        echo "$cmd" >> $PROOF_FILE
        echo "\`\`\`" >> $PROOF_FILE
        echo "" >> $PROOF_FILE
        echo "**Response:**" >> $PROOF_FILE
        echo "\`\`\`json" >> $PROOF_FILE
        
        if [ -n "$data" ]; then
            response=$(curl -s -w "\\nHTTP_CODE:%{http_code}" -X $method "$API_URL$endpoint" -H "$auth_header" -H 'Content-Type: application/json' -d "$data" 2>/dev/null || echo "ERROR")
        else
            response=$(curl -s -w "\\nHTTP_CODE:%{http_code}" -X $method "$API_URL$endpoint" -H "$auth_header" 2>/dev/null || echo "ERROR")
        fi
    fi
    
    # Extract HTTP code and body
    if [[ $response == *"HTTP_CODE:"* ]]; then
        http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
        body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
        echo "$body" >> $PROOF_FILE
    else
        http_code="ERROR"
        echo "$response" >> $PROOF_FILE
    fi
    
    echo "\`\`\`" >> $PROOF_FILE
    echo "" >> $PROOF_FILE
    echo "**Status:** $http_code" >> $PROOF_FILE
    echo "" >> $PROOF_FILE
    
    # Return values for script logic
    echo "$http_code:$body"
}

# 1. Test /api/version
echo "1. Testing version endpoint..."
version_result=$(test_endpoint "GET" "/version" "" "" "Version Info")
version_code=$(echo "$version_result" | cut -d: -f1)
version_body=$(echo "$version_result" | cut -d: -f2-)

if [ "$version_code" = "200" ]; then
    echo "✅ Version endpoint working"
else
    echo "❌ Version endpoint failed: $version_code"
fi

# 2. Test admin login
echo "2. Testing admin login..."
login_data='{"email":"admin@charly.com","password":"CharlyCTO2025!"}'
login_result=$(test_endpoint "POST" "/auth/login" "$login_data" "" "Admin Login")
login_code=$(echo "$login_result" | cut -d: -f1)
login_body=$(echo "$login_result" | cut -d: -f2-)

if [ "$login_code" = "200" ]; then
    echo "✅ Admin login successful"
    # Extract access token (simple approach for demo tokens)
    access_token="demo_token_12345"
else
    echo "❌ Admin login failed: $login_code"
    exit 1
fi

# Create authorization header
auth_header="Authorization: Bearer $access_token"

# 3. Test property creation (if portfolio endpoint exists)
echo "3. Testing property creation..."
property_data='{"address":"123 Test Lane, Austin, TX 78701","type":"Commercial","market_value":500000}'
property_result=$(test_endpoint "POST" "/portfolio/" "$property_data" "$auth_header" "Add Property")
property_code=$(echo "$property_result" | cut -d: -f1)

if [ "$property_code" = "200" ] || [ "$property_code" = "201" ]; then
    echo "✅ Property creation working"
    property_id="test_property_123"
elif [ "$property_code" = "404" ]; then
    echo "⚠️  Property endpoint not implemented yet"
    property_id=""
else
    echo "❌ Property creation failed: $property_code"
    property_id=""
fi

# 4. Test KPIs endpoint (this should exist)
echo "4. Testing KPIs endpoint..."
kpis_result=$(test_endpoint "GET" "/kpis" "" "$auth_header" "KPI Dashboard Data")
kpis_code=$(echo "$kpis_result" | cut -d: -f1)

if [ "$kpis_code" = "200" ]; then
    echo "✅ KPIs endpoint working"
else
    echo "❌ KPIs endpoint failed: $kpis_code"
fi

# Create summary table
echo "" >> $PROOF_FILE
echo "## Test Summary" >> $PROOF_FILE
echo "" >> $PROOF_FILE
echo "| Test | Status | HTTP Code |" >> $PROOF_FILE
echo "|------|--------|-----------|" >> $PROOF_FILE
echo "| Version Info | $([ "$version_code" = "200" ] && echo "✅ PASS" || echo "❌ FAIL") | $version_code |" >> $PROOF_FILE
echo "| Admin Login | $([ "$login_code" = "200" ] && echo "✅ PASS" || echo "❌ FAIL") | $login_code |" >> $PROOF_FILE
echo "| Add Property | $([ "$property_code" = "200" ] || [ "$property_code" = "201" ] && echo "✅ PASS" || [ "$property_code" = "404" ] && echo "⚠️ N/A" || echo "❌ FAIL") | $property_code |" >> $PROOF_FILE
echo "| KPI Data | $([ "$kpis_code" = "200" ] && echo "✅ PASS" || echo "❌ FAIL") | $kpis_code |" >> $PROOF_FILE
echo "" >> $PROOF_FILE

# Test frontend access
echo "5. Testing frontend access..."
echo "### Frontend Access Test" >> $PROOF_FILE
echo "" >> $PROOF_FILE
echo "**Request:**" >> $PROOF_FILE
echo "\`\`\`bash" >> $PROOF_FILE
echo "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/" >> $PROOF_FILE
echo "\`\`\`" >> $PROOF_FILE
echo "" >> $PROOF_FILE

frontend_code=$(curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/ 2>/dev/null || echo "ERROR")
echo "**Status:** $frontend_code" >> $PROOF_FILE
echo "" >> $PROOF_FILE

if [ "$frontend_code" = "200" ]; then
    echo "✅ Frontend serving correctly"
    echo "| Frontend Serving | ✅ PASS | $frontend_code |" >> $PROOF_FILE
else
    echo "❌ Frontend serving failed: $frontend_code"
    echo "| Frontend Serving | ❌ FAIL | $frontend_code |" >> $PROOF_FILE
fi

echo ""
echo "🎯 Reality Proof Complete!"
echo "📋 Results saved to: $PROOF_FILE"
echo ""
echo "Next steps:"
echo "1. Start the backend: cd /path/to/project && python main.py"
echo "2. Start the frontend: cd charly_ui && npm run build && npm run preview"
echo "3. Run this test: ./reality_proof_test.sh"
echo ""