#!/bin/bash

# CHARLY Dashboard Debug Script
# CTO-level systematic debugging for persistent dashboard update issues
# This script traces the entire chain from source files to browser rendering

echo "🚨 CHARLY DASHBOARD DEBUG SCRIPT - CTO ROOT CAUSE ANALYSIS 🚨"
echo "================================================="
echo "Date: $(date)"
echo "Working Directory: $(pwd)"
echo ""

# 1. FILE SYSTEM VERIFICATION
echo "=== 1. FILE SYSTEM VERIFICATION ==="
echo "Checking if files are actually being modified..."

# Check file timestamps
echo "Dashboard.tsx last modified: $(stat -f %Sm /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/components/Dashboard.tsx)"
echo "App.tsx last modified: $(stat -f %Sm /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/App.tsx)"

# Verify our changes exist
echo ""
echo "Verifying our test changes exist in Dashboard.tsx:"
grep -n "🚨 DASHBOARD COMPONENT IS LOADING" /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/components/Dashboard.tsx
grep -n "SECOND TEST BANNER" /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/components/Dashboard.tsx
grep -n "console.log.*🚨" /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/components/Dashboard.tsx

echo ""
echo "Verifying DASHBOARD_NEW default in App.tsx:"
grep -n "DASHBOARD_NEW" /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/App.tsx

echo ""
echo "=== 2. DUPLICATE FILE DETECTION ==="
echo "Searching for ALL Dashboard files that might be interfering..."
find /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY -name "*Dashboard*.tsx" -not -path "*/node_modules/*" | while read file; do
    echo "Found: $file"
    echo "  Size: $(wc -c < "$file") bytes"
    echo "  Modified: $(stat -f %Sm "$file")"
    echo "  Contains test banner: $(grep -q "🚨 DASHBOARD COMPONENT IS LOADING" "$file" && echo "YES" || echo "NO")"
    echo ""
done

echo ""
echo "=== 3. IMPORT RESOLUTION TRACING ==="
echo "Tracing Dashboard import in App.tsx..."
grep -n "import.*Dashboard" /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/App.tsx
echo ""

echo "Checking if there are any barrel exports or index files..."
find /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src -name "index.ts" -o -name "index.tsx" | while read file; do
    echo "Found index file: $file"
    if grep -q "Dashboard" "$file"; then
        echo "  Contains Dashboard export: YES"
        grep -n "Dashboard" "$file"
    else
        echo "  Contains Dashboard export: NO"
    fi
    echo ""
done

echo ""
echo "=== 4. BUILD CACHE INVESTIGATION ==="
echo "Checking for build cache directories..."
find /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY -type d -name ".vite" -o -name "node_modules/.vite" -o -name "dist" -o -name ".next" -o -name ".cache" | while read dir; do
    echo "Found cache dir: $dir"
    echo "  Size: $(du -sh "$dir" 2>/dev/null | cut -f1)"
    echo "  Last modified: $(stat -f %Sm "$dir" 2>/dev/null)"
    echo ""
done

echo ""
echo "=== 5. VITE CONFIGURATION ANALYSIS ==="
echo "Checking Vite config..."
if [ -f "vite.config.ts" ]; then
    echo "Vite config found. Checking for alias configurations..."
    grep -A 5 -B 5 "alias" vite.config.ts
else
    echo "No vite.config.ts found"
fi

echo ""
echo "=== 6. PACKAGE.JSON ANALYSIS ==="
echo "Checking package.json scripts..."
grep -A 10 "scripts" package.json

echo ""
echo "=== 7. TYPESCRIPT CONFIGURATION ==="
echo "Checking TypeScript config..."
if [ -f "tsconfig.json" ]; then
    echo "TypeScript config found. Checking paths and baseUrl..."
    grep -A 10 -B 2 "paths\|baseUrl\|moduleResolution" tsconfig.json
else
    echo "No tsconfig.json found"
fi

echo ""
echo "=== 8. PROCESS ANALYSIS ==="
echo "Checking what's actually running..."
ps aux | grep -E "vite|node|npm" | grep -v grep

echo ""
echo "=== 9. NETWORK ANALYSIS ==="
echo "Checking what's serving on port 5173..."
lsof -i :5173 2>/dev/null || echo "No process found on port 5173"

echo ""
echo "=== 10. LIVE SERVER CONTENT CHECK ==="
echo "Checking what the server is actually serving..."
curl -s "http://localhost:5173" > /tmp/server_response.html
echo "Server response size: $(wc -c < /tmp/server_response.html) bytes"
echo "Response contains our test banner: $(grep -q "🚨 DASHBOARD COMPONENT IS LOADING" /tmp/server_response.html && echo "YES" || echo "NO")"
echo "Response contains React: $(grep -q "React" /tmp/server_response.html && echo "YES" || echo "NO")"

echo ""
echo "=== 11. BROWSER CACHE INVESTIGATION ==="
echo "Checking if browser cache might be the issue..."
echo "Try these URLs with cache-busting:"
echo "  http://localhost:5173/?t=$(date +%s)"
echo "  http://localhost:5173/?nocache=true"

echo ""
echo "=== 12. FILE CONTENT VERIFICATION ==="
echo "Showing first 50 lines of Dashboard.tsx to verify content..."
head -50 /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/components/Dashboard.tsx

echo ""
echo "=== 13. SYMBOLIC LINK CHECK ==="
echo "Checking if files are symbolic links..."
ls -la /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/components/Dashboard.tsx
ls -la /Users/georgewohlleb/Desktop/CHARLY_TEST/CHARLY/src/App.tsx

echo ""
echo "=== 14. DIRECTORY STRUCTURE ==="
echo "Current directory structure:"
pwd
ls -la

echo ""
echo "=== SUMMARY AND RECOMMENDATIONS ==="
echo "1. Check the file modification times above"
echo "2. Look for duplicate Dashboard files"
echo "3. Verify the import path in App.tsx"
echo "4. Check for build cache issues"
echo "5. Verify what the server is actually serving"
echo ""
echo "If changes are not reflected, the issue is likely:"
echo "  - Wrong file being edited (import resolution)"
echo "  - Build cache not clearing"
echo "  - Browser cache issues"
echo "  - File system sync problems"
echo ""
echo "=== DEBUG SCRIPT COMPLETE ==="