#!/bin/bash
# CHARLY Demo Data Reset Script v0.9.1-demo-lock
# Resets demo to clean state (best effort, non-destructive)

echo "🔄 Resetting CHARLY Demo Data..."

# Check if server is running
SERVER_RUNNING=false
if curl -s http://127.0.0.1:8001/api/health > /dev/null 2>&1; then
    SERVER_RUNNING=true
    echo "📡 Server detected as running"
else
    echo "⚠️  Server not detected - some resets may not work"
fi

# Reset 1: Clear temporary files (safe)
echo "🧹 Clearing temporary files..."
rm -f fastapi_backend/generated_packets/*.pdf 2>/dev/null || true
rm -f fastapi_backend/generated_certificates/*.pdf 2>/dev/null || true
rm -f /tmp/charly_reports/*.pdf 2>/dev/null || true
echo "   ✅ Temporary files cleared"

# Reset 2: Database reset (if demo endpoint exists)
if [ "$SERVER_RUNNING" = true ]; then
    echo "🗄️  Attempting database reset via API..."
    
    # Try to find demo/reset endpoints
    if curl -s http://127.0.0.1:8001/api/auth/health | grep -q "demo_user"; then
        echo "   📊 Demo user exists - database appears functional"
        
        # Check if there are any admin/reset endpoints
        # (No destructive calls - just check what's available)
        echo "   ℹ️  No automated reset endpoint found"
    fi
fi

# Reset 3: Server logs rotation (safe)
echo "📝 Rotating server logs..."
if [ -f "fastapi_backend/server.foreground.log" ]; then
    mv fastapi_backend/server.foreground.log "fastapi_backend/server.foreground.log.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
fi
echo "   ✅ Logs rotated"

# Reset 4: Clear any cached auth tokens (safe)
echo "🔐 Clearing any cached tokens..."
# Note: Tokens are stateless JWT, no server-side cleanup needed
echo "   ℹ️  JWT tokens are stateless - clients should refresh"

# Manual reset instructions (commented for operators)
cat << 'EOF'

📋 MANUAL RESET STEPS (if needed):
# 1. Full database reset (destructive):
#    rm -f fastapi_backend/charly_dev.db
#    # Server will recreate on next start

# 2. Portfolio data reset:
#    # No automated endpoint - demo uses in-memory sample data
#    # Restart server to reload sample properties

# 3. User accounts reset:
#    # Demo user (admin@charly.com) is auto-created on startup
#    # Other test users: register new ones as needed

# 4. Complete environment reset:
#    ./stop_demo.sh
#    rm -f fastapi_backend/charly_dev.db
#    ./start_demo.sh
EOF

echo ""
echo "✅ Demo data reset completed"
echo "💡 For complete reset, see manual steps above"
echo "🔄 Use ./stop_demo.sh && ./start_demo.sh for fresh start"