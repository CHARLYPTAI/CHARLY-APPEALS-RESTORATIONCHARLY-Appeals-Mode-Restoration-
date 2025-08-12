# CHARLY Release Pack v0.9.8 (pruned-hotfix)

## What this is
A verified, smoke-tested release of CHARLY with pruned shadows and an authentication hotfix.

## Artifacts
- charly_v0.9.6-nuke-drift.zip — GREEN baseline (pre-prune)
- charly_v0.9.7-pruned.zip — PRUNED baseline (post-smoke)
- charly_v0.9.8-pruned-hotfix.zip — Hotfix committed & verified
- PhaseR_Cleanup.md — full execution and proof log
- moved_files_table.md — quarantined files (pre-prune)
- e2e_smoke.sh — deterministic end-to-end test
- smoke_*.txt — smoke outputs
- api_version.json — backend version snapshot
- SHA256SUMS.txt — checksums of the zips

## One Runtime, One Truth
Run only via FastAPI at http://127.0.0.1:8001. Do NOT run Vite/HMR (:5174).

## Quickstart (local verify)
1. Ensure FastAPI is running on :8001 and serving the built UI.
2. Clear browser site data & unregister service workers.
3. Hard reload (⌘⇧R). No auth-error banner should appear logged-out.
4. Run the smoke:
   ```bash
   chmod +x e2e_smoke.sh
   ./e2e_smoke.sh
   ```
   Expected: 8/8 steps, final OK.

## Rollback Points
- v0.9.6-nuke-drift → pre-prune GREEN baseline
- v0.9.7-pruned → pruned baseline (post-smoke)
- v0.9.8-pruned-hotfix → hotfix committed & verified

## Rollback Commands (examples)
```bash
# Tags
git checkout v0.9.7-pruned

# Restore quarantined archives if needed
git restore --source=v0.9.6-nuke-drift -- fastapi_backend/archive/unused charly_ui/archive/unused
```

## Known Hazards
- Don't reintroduce dev server :5174.
- All frontend API calls must route through authenticatedRequest(...) to relative /api/....

## Version Stamp
Backend X-CHARLY-Version: 426b6b5985313ca231f8a691813113dca9168d49@2025-08-12T00:44:13.168614Z