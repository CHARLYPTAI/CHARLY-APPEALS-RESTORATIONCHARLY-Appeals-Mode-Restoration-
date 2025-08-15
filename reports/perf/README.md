# CHARLY Performance Reports

All perf artifacts live here. Use `pnpm perf:*` scripts for quick smoke tests.

## Performance Targets

**Current baselines (dev environment):**
- **Health endpoint**: p95 < 50ms, p99 < 100ms  
- **Read operations** (jurisdictions): p95 < 300ms, p99 < 500ms
- **Write operations** (validation): p95 < 600ms, p99 < 1000ms

## Available Scripts

```bash
# Health check performance (8 connections, 30s)
pnpm perf:health

# Read endpoint performance (10 connections, 30s) 
pnpm perf:read

# Write endpoint performance (8 connections, 30s)
pnpm perf:write
```

## Usage Notes

- Scripts are designed for local smoke testing only
- Requires dev server running on localhost:3000
- Thresholds are conservative for dev environment
- Production thresholds would be tighter and environment-specific