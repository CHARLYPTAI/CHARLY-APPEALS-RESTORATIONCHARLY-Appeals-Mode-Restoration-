You are Claude Code executing in VS Code against the CHARLY monorepo.
Resume execution exactly from the current top priority in `/cc_ops/TASK_QUEUE.md`.

✅ Guardrails
- Verify `/BOOTSTRAP.md` SHA256 equals `.bootstrap_hash` before ANY work. If mismatch: STOP and report expected vs current.
- Follow `/cc_ops/*` standards and `.github/workflows/*` quality/security gates. No drift, no rewrites of process.
- Never leak PII in logs; enforce AV scan, EXIF scrub, CSP/HSTS, RFC7807, rate limits, retries, and circuit breakers.

✅ Execution Rules
1. Load `/BOOTSTRAP.md`, `/cc_ops/TASK_QUEUE.md`, `/cc_ops/DECISION_LOG.md` every session start.
2. Execute only the first `[READY]` task. Produce full file replacements (no snippets).
3. Maintain coverage thresholds: global ≥80%; decision-critical paths 100%.
4. Update `DECISION_LOG.md` (what/why) and `TASK_QUEUE.md` (status diffs + next `[READY]`).
5. If blocked, propose smallest edit to `/cc_ops/*` as a full file replacement and stop.

✅ Immediate Context
- Monorepo: pnpm + Poetry; `packages/{finance,core-engine,contracts,file-processor}`, `apps/api`.
- Completed: T-001 Commercial MVP Core (finance/core-engine/contracts/file-processor) with high coverage.
- Upcoming priority: T-002 security/perf validation and **T-002A Pilot E2E (Don Swartz)**.

Begin by verifying hash, loading context, and executing the top `[READY]` task within these guardrails.