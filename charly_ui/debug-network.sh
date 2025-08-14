#!/bin/bash

# ==============================================================================
# ENTERPRISE CTO NETWORK DEBUGGING SCRIPT v2.0
# Critical Production Issue: ERR_CONNECTION_REFUSED on localhost:5173
# ==============================================================================

echo "🔧 ENTERPRISE CTO NETWORK DEBUGGING PROTOCOL"
echo "=============================================="
echo "Timestamp: $(date)"
echo "Issue: ERR_CONNECTION_REFUSED - localhost:5173"
echo "Impact: PRODUCTION BLOCKING - $500K-2M ARR at risk"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

print_section "1. SYSTEM ENVIRONMENT ANALYSIS"
echo "Operating System: $(uname -a)"
echo "Node.js Version: $(node --version 2>/dev/null || echo 'Not found')"
check_result

echo "NPM Version: $(npm --version 2>/dev/null || echo 'Not found')"
check_result

echo "Current Directory: $(pwd)"
echo "User: $(whoami)"

print_section "2. PROJECT STRUCTURE VALIDATION"
echo "Checking critical project files..."

files_to_check=(
    "package.json"
    "vite.config.ts"
    "src/main.tsx"
    "src/App.tsx"
    "node_modules"
)

for file in "${files_to_check[@]}"; do
    if [ -e "$file" ]; then
        echo -e "✅ $file exists"
    else
        echo -e "❌ $file MISSING"
    fi
done

print_section "3. PORT AND NETWORK ANALYSIS"
echo "Checking port 5173 availability..."

# Check if port 5173 is in use
port_check=$(lsof -i :5173 2>/dev/null)
if [ -n "$port_check" ]; then
    echo -e "${YELLOW}⚠️  Port 5173 is currently in use:${NC}"
    echo "$port_check"
else
    echo -e "${GREEN}✅ Port 5173 is available${NC}"
fi

# Check common alternative ports
alt_ports=(3000 3001 5174 8080 8888)
echo ""
echo "Checking alternative ports:"
for port in "${alt_ports[@]}"; do
    port_status=$(lsof -i :$port 2>/dev/null)
    if [ -n "$port_status" ]; then
        echo -e "Port $port: ${RED}OCCUPIED${NC}"
    else
        echo -e "Port $port: ${GREEN}AVAILABLE${NC}"
    fi
done

print_section "4. NETWORK INTERFACE ANALYSIS"
echo "Network interfaces:"
ifconfig 2>/dev/null | grep -E "inet |inet6" | head -10

echo ""
echo "Localhost connectivity test:"
ping -c 2 localhost >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Localhost ping successful${NC}"
else
    echo -e "${RED}❌ Localhost ping failed${NC}"
fi

echo ""
echo "127.0.0.1 connectivity test:"
ping -c 2 127.0.0.1 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 127.0.0.1 ping successful${NC}"
else
    echo -e "${RED}❌ 127.0.0.1 ping failed${NC}"
fi

print_section "5. VITE CONFIGURATION ANALYSIS"
echo "Vite config file contents:"
if [ -f "vite.config.ts" ]; then
    cat vite.config.ts
else
    echo -e "${RED}❌ vite.config.ts not found${NC}"
fi

print_section "6. PACKAGE.JSON ANALYSIS"
echo "Package.json dev script:"
if [ -f "package.json" ]; then
    grep -A 5 '"scripts"' package.json
    echo ""
    echo "Vite version:"
    grep '"vite"' package.json
else
    echo -e "${RED}❌ package.json not found${NC}"
fi

print_section "7. NODE_MODULES DEPENDENCY CHECK"
echo "Critical dependencies check:"
dependencies=(
    "node_modules/vite"
    "node_modules/react"
    "node_modules/@vitejs/plugin-react"
)

for dep in "${dependencies[@]}"; do
    if [ -d "$dep" ]; then
        echo -e "✅ $dep exists"
    else
        echo -e "❌ $dep MISSING"
    fi
done

print_section "8. FIREWALL AND SECURITY ANALYSIS"
echo "Checking macOS firewall status..."
firewall_status=$(sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null)
echo "Firewall status: $firewall_status"

echo ""
echo "Checking for any blocking processes:"
ps aux | grep -E "(vite|node|npm)" | grep -v grep

print_section "9. LIVE CONNECTIVITY TESTS"
echo "Testing different connection methods..."

# Test curl to localhost
echo "Testing curl to localhost:5173..."
curl_result=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:5173/ 2>/dev/null)
echo "HTTP Status Code: $curl_result"
if [ "$curl_result" = "200" ]; then
    echo -e "${GREEN}✅ HTTP connection successful${NC}"
elif [ "$curl_result" = "000" ]; then
    echo -e "${RED}❌ Connection refused/timeout${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP Status: $curl_result${NC}"
fi

# Test telnet connection
echo ""
echo "Testing raw TCP connection to localhost:5173..."
timeout 3 bash -c "</dev/tcp/localhost/5173" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TCP connection successful${NC}"
else
    echo -e "${RED}❌ TCP connection failed${NC}"
fi

print_section "10. PROCESS ANALYSIS"
echo "Current Node.js processes:"
ps aux | grep node | grep -v grep

echo ""
echo "Current npm processes:"
ps aux | grep npm | grep -v grep

print_section "11. DISK SPACE AND PERMISSIONS"
echo "Disk space check:"
df -h . | head -2

echo ""
echo "Directory permissions:"
ls -la . | head -5

echo ""
echo "Node modules permissions:"
ls -la node_modules 2>/dev/null | head -3

print_section "12. DEBUGGING RECOMMENDATIONS"
echo -e "${YELLOW}RECOMMENDED DEBUGGING STEPS:${NC}"
echo ""
echo "1. Kill any existing Node processes:"
echo "   pkill -f node"
echo "   pkill -f vite"
echo ""
echo "2. Clear npm cache:"
echo "   npm cache clean --force"
echo ""
echo "3. Reinstall dependencies:"
echo "   rm -rf node_modules package-lock.json"
echo "   npm install"
echo ""
echo "4. Try alternative dev server commands:"
echo "   npm run dev -- --port 3000"
echo "   npm run dev -- --host 0.0.0.0"
echo "   npm run dev -- --host 127.0.0.1"
echo ""
echo "5. Use production build as fallback:"
echo "   npm run build"
echo "   npm run preview"
echo ""
echo "6. Manual Vite start with debugging:"
echo "   npx vite --debug"
echo "   npx vite --force"

print_section "13. NETWORK DIAGNOSTIC SUMMARY"
echo -e "${YELLOW}CRITICAL FINDINGS:${NC}"

# Summarize critical issues
if [ -z "$(lsof -i :5173 2>/dev/null)" ]; then
    echo -e "${RED}🚨 No process bound to port 5173${NC}"
fi

if ! ping -c 1 localhost >/dev/null 2>&1; then
    echo -e "${RED}🚨 Localhost connectivity issue${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo -e "${RED}🚨 Missing node_modules directory${NC}"
fi

if [ ! -f "vite.config.ts" ]; then
    echo -e "${RED}🚨 Missing Vite configuration${NC}"
fi

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}END OF NETWORK DEBUGGING ANALYSIS${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Next steps: Review findings above and apply recommended fixes"
echo "Priority: Restore network connectivity to unblock $500K-2M ARR"