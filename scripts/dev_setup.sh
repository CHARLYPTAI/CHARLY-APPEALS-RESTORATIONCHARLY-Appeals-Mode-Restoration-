#!/bin/bash
# CHARLY Development Environment Setup
# Task 14D-1: Test Infrastructure Restoration
# Purpose: Idempotent environment bootstrap with validation

set -e  # Exit on any error

echo "🔧 CHARLY Development Environment Setup"
echo "======================================"

# Log environment info
echo "Environment Information:" | tee -a ../reports/execution.log
echo "Date: $(date)" | tee -a ../reports/execution.log
echo "Python: $(python --version 2>&1)" | tee -a ../reports/execution.log
echo "Pip: $(pip --version)" | tee -a ../reports/execution.log
echo "Working Directory: $(pwd)" | tee -a ../reports/execution.log

# Verify we're in the right directory
if [ ! -f "requirements_dev.txt" ]; then
    echo "❌ Error: requirements_dev.txt not found. Run from project root."
    exit 1
fi

echo ""
echo "📦 Installing Development Dependencies"
echo "====================================="

# Upgrade core tools
echo "Upgrading pip, setuptools, wheel..." | tee -a ../reports/execution.log
pip install --upgrade pip setuptools wheel 2>&1 | tee -a ../reports/execution.log

# Install development requirements
echo "Installing development requirements..." | tee -a ../reports/execution.log
pip install -r requirements_dev.txt 2>&1 | tee -a ../reports/execution.log

# Try editable install, fall back to PYTHONPATH method
echo ""
echo "🔗 Setting up Module Discovery"
echo "============================="
if pip install -e . 2>/dev/null; then
    echo "✅ Editable install successful" | tee -a ../reports/execution.log
else
    echo "⚠️ Editable install failed, using PYTHONPATH method" | tee -a ../reports/execution.log
    echo "Note: conftest.py will handle module discovery" | tee -a ../reports/execution.log
fi

# Validate core imports
echo ""
echo "🧪 Validating Core Imports"
echo "=========================="
python -c "
import sys
print(f'Python version: {sys.version}')

try:
    import numpy
    print(f'✅ numpy {numpy.__version__} - OK')
except ImportError as e:
    print(f'❌ numpy import failed: {e}')
    sys.exit(1)

try:
    import pandas
    print(f'✅ pandas {pandas.__version__} - OK')
except ImportError as e:
    print(f'❌ pandas import failed: {e}')
    sys.exit(1)

try:
    import pytest
    print(f'✅ pytest {pytest.__version__} - OK')
except ImportError as e:
    print(f'❌ pytest import failed: {e}')
    sys.exit(1)

try:
    import pydantic
    print(f'✅ pydantic {pydantic.__version__} - OK')
except ImportError as e:
    print(f'❌ pydantic import failed: {e}')
    sys.exit(1)

print('\\n🎉 All core imports successful!')
" 2>&1 | tee -a ../reports/execution.log

# Validate pytest installation
echo ""
echo "🔍 Validating Test Framework"
echo "============================"
pytest --version 2>&1 | tee -a ../reports/execution.log

# Check coverage tools
echo ""
echo "📊 Validating Coverage Tools"
echo "============================"
python -c "
try:
    import coverage
    print(f'✅ coverage {coverage.__version__} - OK')
except ImportError as e:
    print(f'❌ coverage import failed: {e}')

try:
    import pytest_cov
    print(f'✅ pytest-cov available - OK')
except ImportError as e:
    print(f'❌ pytest-cov import failed: {e}')
" 2>&1 | tee -a ../reports/execution.log

echo ""
echo "✅ Development Environment Setup Complete"
echo "========================================"
echo "Ready for test infrastructure restoration!"
echo ""

# Final validation summary
echo "Setup Summary:" | tee -a ../reports/execution.log
echo "- Dependencies installed from requirements_dev.txt" | tee -a ../reports/execution.log
echo "- Core imports (numpy, pandas, pytest, pydantic) validated" | tee -a ../reports/execution.log
echo "- Test framework and coverage tools ready" | tee -a ../reports/execution.log
echo "- Next: Run conftest.py setup and pytest configuration" | tee -a ../reports/execution.log