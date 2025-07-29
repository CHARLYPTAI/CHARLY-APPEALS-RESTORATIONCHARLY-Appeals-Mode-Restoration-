#!/bin/bash

# 🍎 APPLE CTO EMERGENCY DEBUG PROTOCOL
# Comprehensive Git Push Failure Root Cause Analysis Script
# This script will trace every possible dependency causing push failures

echo "🚨 APPLE CTO EMERGENCY DEBUG PROTOCOL - Git Push Failure Analysis"
echo "=================================================================="
echo "Timestamp: $(date)"
echo "Working Directory: $(pwd)"
echo ""

# Function to log and execute commands
log_and_run() {
    echo "🔍 EXECUTING: $*"
    echo "----------------------------------------"
    "$@" 2>&1 | head -50
    echo "Exit Code: $?"
    echo ""
}

# 1. GIT CONFIGURATION ANALYSIS
echo "📋 1. GIT CONFIGURATION ANALYSIS"
echo "================================"
log_and_run git --version
log_and_run git config --list --show-origin
log_and_run git remote -v
log_and_run git status --porcelain
log_and_run git log --oneline -5

# 2. GIT HOOKS ANALYSIS
echo "📋 2. GIT HOOKS ANALYSIS"
echo "======================="
echo "🔍 Git hooks directory contents:"
if [ -d ".git/hooks" ]; then
    ls -la .git/hooks/
    echo ""
    for hook in .git/hooks/*; do
        if [ -f "$hook" ] && [ -x "$hook" ]; then
            echo "🔍 Executable hook found: $hook"
            echo "Contents:"
            head -20 "$hook"
            echo "---"
        fi
    done
else
    echo "No .git/hooks directory found"
fi
echo ""

# 3. HUSKY CONFIGURATION ANALYSIS
echo "📋 3. HUSKY CONFIGURATION ANALYSIS"
echo "=================================="
echo "🔍 Checking for Husky configuration:"
if [ -f ".husky/_/husky.sh" ]; then
    echo "Husky found. Contents:"
    cat .husky/_/husky.sh
fi

if [ -d ".husky" ]; then
    echo "🔍 .husky directory contents:"
    find .husky -type f -exec echo "File: {}" \; -exec cat {} \; -exec echo "---" \;
fi

if [ -f "package.json" ]; then
    echo "🔍 Package.json husky config:"
    grep -A5 -B5 "husky\|prepare\|pre-commit" package.json || echo "No husky config in package.json"
fi
echo ""

# 4. PACKAGE.JSON SCRIPTS ANALYSIS
echo "📋 4. PACKAGE.JSON SCRIPTS ANALYSIS"
echo "==================================="
if [ -f "package.json" ]; then
    echo "🔍 All scripts in package.json:"
    grep -A50 '"scripts"' package.json | head -100
    echo ""
    
    echo "🔍 Pre-commit related scripts:"
    grep -i "pre-commit\|lint\|test\|prepare" package.json || echo "No pre-commit scripts found"
else
    echo "No package.json found"
fi
echo ""

# 5. ESLINT CONFIGURATION ANALYSIS
echo "📋 5. ESLINT CONFIGURATION ANALYSIS"
echo "==================================="
echo "🔍 ESLint config files:"
ls -la eslint* .eslintrc* 2>/dev/null || echo "No ESLint config files found"

if [ -f "eslint.config.js" ]; then
    echo "🔍 eslint.config.js contents:"
    cat eslint.config.js
fi

if [ -f ".eslintrc.js" ]; then
    echo "🔍 .eslintrc.js contents:"
    cat .eslintrc.js
fi
echo ""

# 6. TYPESCRIPT CONFIGURATION ANALYSIS
echo "📋 6. TYPESCRIPT CONFIGURATION ANALYSIS"
echo "======================================="
echo "🔍 TypeScript config files:"
ls -la tsconfig* 2>/dev/null || echo "No TypeScript config files found"

if [ -f "tsconfig.json" ]; then
    echo "🔍 tsconfig.json contents:"
    cat tsconfig.json
fi
echo ""

# 7. PRE-COMMIT DEPENDENCIES ANALYSIS
echo "📋 7. PRE-COMMIT DEPENDENCIES ANALYSIS"
echo "======================================"
echo "🔍 Checking for pre-commit frameworks:"

# Check for pre-commit Python package
if command -v pre-commit &> /dev/null; then
    echo "🔍 Pre-commit (Python) found:"
    log_and_run pre-commit --version
    if [ -f ".pre-commit-config.yaml" ]; then
        echo "🔍 .pre-commit-config.yaml contents:"
        cat .pre-commit-config.yaml
    fi
fi

# Check for lint-staged
if [ -f "package.json" ] && grep -q "lint-staged" package.json; then
    echo "🔍 lint-staged configuration found:"
    grep -A10 -B2 "lint-staged" package.json
fi
echo ""

# 8. NODE_MODULES ANALYSIS
echo "📋 8. NODE_MODULES ANALYSIS"
echo "=========================="
if [ -d "node_modules" ]; then
    echo "🔍 Node modules size:"
    du -sh node_modules/
    
    echo "🔍 Husky in node_modules:"
    ls -la node_modules/.bin/husky 2>/dev/null || echo "Husky not found in node_modules"
    
    echo "🔍 ESLint in node_modules:"
    ls -la node_modules/.bin/eslint 2>/dev/null || echo "ESLint not found in node_modules"
else
    echo "No node_modules directory found"
fi
echo ""

# 9. SIMULATE PRE-COMMIT EXECUTION
echo "📋 9. SIMULATE PRE-COMMIT EXECUTION"
echo "=================================="
echo "🔍 Attempting to run pre-commit hook manually:"

if [ -f ".git/hooks/pre-commit" ]; then
    echo "Running .git/hooks/pre-commit directly:"
    .git/hooks/pre-commit 2>&1 | head -50
    echo "Exit code: $?"
elif [ -f ".husky/pre-commit" ]; then
    echo "Running .husky/pre-commit directly:"
    .husky/pre-commit 2>&1 | head -50
    echo "Exit code: $?"
else
    echo "No pre-commit hook found to test"
fi
echo ""

# 10. REPOSITORY SIZE ANALYSIS
echo "📋 10. REPOSITORY SIZE ANALYSIS"
echo "==============================="
echo "🔍 Repository size breakdown:"
log_and_run du -sh .git/
log_and_run git count-objects -vH

echo "🔍 Largest files in repository:"
log_and_run find . -type f -size +10M 2>/dev/null | head -10

echo "🔍 Git index size:"
log_and_run ls -lh .git/index 2>/dev/null || echo "No git index file"
echo ""

# 11. NETWORK AND AUTHENTICATION
echo "📋 11. NETWORK AND AUTHENTICATION"
echo "================================="
echo "🔍 Testing GitHub connectivity:"
log_and_run ssh -T git@github.com
echo ""

echo "🔍 Testing HTTPS connectivity:"
log_and_run curl -I https://github.com

echo "🔍 Git credential configuration:"
log_and_run git config --get credential.helper
echo ""

# 12. ATTEMPT MINIMAL COMMIT
echo "📋 12. ATTEMPT MINIMAL COMMIT"
echo "============================="
echo "🔍 Creating minimal test commit:"

# Create a simple test file
echo "# Test commit $(date)" > .debug_test_file
git add .debug_test_file

echo "🔍 Attempting commit with hooks:"
git commit -m "DEBUG: Test commit with hooks" 2>&1 | head -50
echo "Commit exit code: $?"

echo "🔍 Attempting commit without hooks:"
git commit --no-verify -m "DEBUG: Test commit without hooks" 2>&1 | head -50
echo "No-verify commit exit code: $?"

# Clean up test file
git reset HEAD~1 --soft 2>/dev/null
rm -f .debug_test_file
echo ""

# 13. FINAL SUMMARY
echo "📋 13. FINAL SUMMARY"
echo "==================="
echo "🔍 Key findings summary:"
echo "- Git version: $(git --version)"
echo "- Repository status: $(git status --porcelain | wc -l) changed files"
echo "- Hooks present: $(ls .git/hooks/ 2>/dev/null | wc -l) files"
echo "- Node modules: $([ -d node_modules ] && echo "Present" || echo "Missing")"
echo "- Package.json: $([ -f package.json ] && echo "Present" || echo "Missing")"
echo ""

echo "🚨 APPLE CTO DEBUG PROTOCOL COMPLETE"
echo "===================================="
echo "Review the output above to identify the root cause of push failures."
echo "Look for:"
echo "1. Failed pre-commit hooks"
echo "2. Missing dependencies"
echo "3. Configuration errors"
echo "4. Network/auth issues"
echo ""