# CHARLY Rollback Plan v0.9.1-demo-lock

## Quick Rollback Commands

### Emergency Rollback to Previous Working State
```bash
# Stop current demo
./stop_demo.sh

# Rollback to previous tag (v0.9.1-demo)
git checkout v0.9.1-demo

# Restart with previous version
./start_demo.sh  # (if script exists, otherwise manual start)
```

### Rollback to Specific Previous Tags
```bash
# Available rollback points:
git tag --sort=-version:refname | head -5

# Rollback to specific tag
git checkout v0.9-demo        # Original working demo
git checkout v0.9.1-demo     # Phase 6 enhancements  
git checkout v0.9.1-demo-lock # Phase 7 ops lock (current)
```

### File-Level Rollbacks
```bash
# Rollback specific operational files only
git restore Demo_Operator_Card.md
git restore start_demo.sh stop_demo.sh
git restore reset_demo_data.sh final_smoke.sh
git restore Rollback_Plan.md

# Rollback Phase 6 search enhancements
git restore fastapi_backend/services/portfolio_service.py
git restore fastapi_backend/routes/portfolio_router.py
```

## Backup Restore

### From Repository Backup
```bash
# Location of backup zip
BACKUP_FILE="./charly_v0.9.1-demo-lock.zip"

# Extract backup (emergency only)
unzip -q "$BACKUP_FILE" -d ./charly_backup_restore/
cd charly_backup_restore/
./start_demo.sh
```

### Database Rollback
```bash
# Remove current database (destructive)
rm -f fastapi_backend/charly_dev.db

# Restart server (will recreate with default demo data)
./stop_demo.sh && ./start_demo.sh
```

## Validation After Rollback

### Quick Health Check
```bash
# Verify rollback success
curl http://127.0.0.1:8001/api/health
curl http://127.0.0.1:8001/api/auth/health

# Test demo login
curl -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@charly.com","password":"CharlyCTO2025!"}'
```

### Full Validation
```bash
# Run smoke test on rolled-back version
./final_smoke.sh  # (if available in that version)
```

## Emergency Contacts & Escalation

### If Demo Breaks During Presentation
1. **Immediate**: Use backup demo URL or local backup
2. **Within 2 minutes**: Execute emergency rollback
3. **Escalate if**: Multiple rollback attempts fail

### Critical Files for Demo
- `fastapi_backend/main.py` - Core server
- `fastapi_backend/core/auth.py` - Authentication
- `fastapi_backend/routes/portfolio_router.py` - Portfolio API
- Database: `fastapi_backend/charly_dev.db`

### Recovery Commands
```bash
# Nuclear option - complete reset
rm -rf ./charly_demo_broken
unzip charly_v0.9.1-demo-lock.zip
cd CHARLY_TEST/
./start_demo.sh
```

## Rollback Success Criteria
- ✅ Server starts on http://127.0.0.1:8001
- ✅ Demo login works: admin@charly.com / CharlyCTO2025!
- ✅ Portfolio shows 3+ properties
- ✅ No 500 errors on key endpoints
- ✅ All 5 demo flows functional

**Last Updated**: August 11, 2025  
**Backup Location**: `./charly_v0.9.1-demo-lock.zip`  
**Git Tag**: v0.9.1-demo-lock