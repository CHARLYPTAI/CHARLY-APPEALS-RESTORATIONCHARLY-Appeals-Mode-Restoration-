# Release Checklist — v0.9.8 (pruned-hotfix)

## Pre-flight
- [ ] Only runtime :8001 active (lsof -i :5174 empty)
- [ ] /api/version reachable; header X-CHARLY-Version present
- [ ] Browser cache cleared; SWs unregistered

## Validate
- [ ] UI loads without auth error banner when logged-out
- [ ] e2e_smoke.sh passes 8/8 with final OK
- [ ] SHA256SUMS for zips verified

## Tag & Artifacts
- [ ] v0.9.6-nuke-drift (pre-prune)
- [ ] v0.9.7-pruned (post-smoke)
- [ ] v0.9.8-pruned-hotfix (hotfix committed)
- [ ] Release zips present with expected sizes (~21MB each)

## Rollback
- [ ] Confirm tag-based fallback strategy documented
- [ ] Restore command for archives noted (if needed)