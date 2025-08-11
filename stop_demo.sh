#!/bin/bash
# CHARLY Demo Stop Script v0.9.1-demo-lock
# Cleanly shuts down demo server

echo "🛑 Stopping CHARLY Demo..."

# Check if PID file exists
if [ -f "fastapi_backend/server.pid" ]; then
    SERVER_PID=$(cat fastapi_backend/server.pid)
    echo "📍 Found server PID: $SERVER_PID"
    
    # Gracefully terminate the process
    if ps -p $SERVER_PID > /dev/null; then
        echo "🔄 Sending SIGTERM to server..."
        kill $SERVER_PID
        
        # Wait up to 10 seconds for graceful shutdown
        for i in {1..10}; do
            if ! ps -p $SERVER_PID > /dev/null; then
                echo "✅ Server stopped gracefully"
                break
            elif [ $i -eq 10 ]; then
                echo "⚠️  Forcing server shutdown..."
                kill -9 $SERVER_PID 2>/dev/null || true
            else
                sleep 1
            fi
        done
    else
        echo "ℹ️  Server process already stopped"
    fi
    
    # Clean up PID file
    rm -f fastapi_backend/server.pid
else
    echo "ℹ️  No PID file found, checking for processes on port 8001..."
fi

# Force kill any remaining processes on port 8001
if lsof -ti:8001 > /dev/null 2>&1; then
    echo "🔧 Cleaning up remaining processes on port 8001..."
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
fi

# Verify port is free
sleep 1
if lsof -ti:8001 > /dev/null 2>&1; then
    echo "❌ Port 8001 still occupied"
    exit 1
else
    echo "✅ Port 8001 is now free"
fi

echo ""
echo "🏁 CHARLY Demo stopped successfully"
echo "Use ./start_demo.sh to restart"