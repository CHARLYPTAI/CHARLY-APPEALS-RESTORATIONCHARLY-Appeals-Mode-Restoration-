#!/bin/sh
# ============================================================================
# CHARLY Platform Production Health Check
# Apple CTO Enterprise - Phase 3A Production Infrastructure
# ============================================================================

# Health check endpoints
FRONTEND_URL="http://localhost:8080"
BACKEND_URL="http://localhost:8000/health"

# Check frontend (Nginx)
echo "Checking frontend health..."
if ! curl -f -s -o /dev/null "$FRONTEND_URL"; then
    echo "Frontend health check failed"
    exit 1
fi

# Check backend API
echo "Checking backend API health..."
if ! curl -f -s -o /dev/null "$BACKEND_URL"; then
    echo "Backend API health check failed"
    exit 1
fi

# Check critical files exist
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "Frontend assets missing"
    exit 1
fi

if [ ! -f "/app/backend/main.py" ]; then
    echo "Backend application missing"
    exit 1
fi

# Check processes are running
if ! pgrep nginx > /dev/null; then
    echo "Nginx process not running"
    exit 1
fi

if ! pgrep python3 > /dev/null; then
    echo "Python backend process not running"
    exit 1
fi

echo "All health checks passed"
exit 0