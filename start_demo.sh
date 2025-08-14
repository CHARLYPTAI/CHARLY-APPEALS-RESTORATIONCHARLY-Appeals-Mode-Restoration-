#!/bin/bash
# CHARLY Demo Start Script v0.9.1-demo-lock
# Starts backend server with health verification

set -e  # Exit on error

echo "🚀 Starting CHARLY Demo v0.9.1-demo-lock..."

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)/fastapi_backend"
export CHARLY_ENV="demo"

# Kill any existing processes on port 8001
echo "🔄 Cleaning up existing processes..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true

# Change to backend directory
cd fastapi_backend

# Start FastAPI server in background
echo "🖥️  Starting FastAPI backend server..."
python3 -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload > server.foreground.log 2>&1 &
SERVER_PID=$!

# Save PID for stop script
echo $SERVER_PID > server.pid

# Wait for server to start
echo "⏳ Waiting for server initialization..."
sleep 5

# Health check with retry
echo "🔍 Performing health check..."
for i in {1..10}; do
    if curl -s http://127.0.0.1:8001/api/health > /dev/null 2>&1; then
        echo "✅ Server health check passed"
        break
    elif [ $i -eq 10 ]; then
        echo "❌ Server health check failed after 10 attempts"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    else
        echo "   Attempt $i/10..."
        sleep 2
    fi
done

# Verify demo user exists
echo "👤 Verifying demo user..."
if curl -s http://127.0.0.1:8001/api/auth/health | grep -q '"demo_user":"exists"'; then
    echo "✅ Demo user verified"
else
    echo "⚠️  Demo user check inconclusive (proceeding)"
fi

# Return to project root
cd ..

echo ""
echo "🎯 CHARLY Demo Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Demo URL: http://127.0.0.1:8001"
echo "📖 API Docs: http://127.0.0.1:8001/docs"
echo "🔐 Admin Login: admin@charly.com / CharlyCTO2025!"
echo "📋 Operator Card: ./Demo_Operator_Card.md"
echo ""
echo "Use ./stop_demo.sh to shutdown cleanly"
echo "Server PID: $SERVER_PID (saved to fastapi_backend/server.pid)"