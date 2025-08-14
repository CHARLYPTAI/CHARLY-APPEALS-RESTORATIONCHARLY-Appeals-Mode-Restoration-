#!/bin/bash

echo "Testing CHARLY V2 Production Deployment"
echo "======================================="

# Test main page
echo -e "\n1. Testing main page load:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://storage.googleapis.com/charly-ui-production-2024/index.html

# Test CSS file
echo -e "\n2. Testing CSS file:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://storage.googleapis.com/charly-ui-production-2024/assets/index-DtNGA5ag.css

# Test main JS bundle
echo -e "\n3. Testing main JS bundle:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://storage.googleapis.com/charly-ui-production-2024/assets/index-CXztoLBE.js

# Test DashboardV3 chunk
echo -e "\n4. Testing DashboardV3 chunk:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://storage.googleapis.com/charly-ui-production-2024/assets/DashboardV3-JfwkeAyr.js

# Get actual content to check for errors
echo -e "\n5. Checking page content:"
curl -s https://storage.googleapis.com/charly-ui-production-2024/index.html | grep -E "(DashboardV3|error|Error)" | head -5

echo -e "\nDone!"