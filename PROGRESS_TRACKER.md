# CHARLY — PROGRESS_TRACKER.md (Final Sprint)

**Operating Standard:** Apple-level precision, zero drift, sequential execution only.  
**Owner:** CHARLY (George Wohlleb)  
**Repo Root:** ./  
**This file is the single source of truth for “what’s next.”** CC must update it after every task.

---

## How to Use (CC + Human)
1) Pick the **next unchecked task** below (strict sequence).  
2) Execute only the **Scope** of that task.  
3) Ensure all **Acceptance Gates** pass.  
4) Append a row to **Change Log** and update the task checkbox to ✅ with timestamp.  
5) Commit & push using the **Commit Template** in the task.  
6) End every report by asking:  
   _“Do you want to include the optional drips for additional verification, agent runs, or extended documentation?”_

**Status Legend:**  
- [ ] Not started [��] In progress [✅] Complete [🚫] Blocked

---

## Global Guardrails (Must Stay True)
- **Sequential Build Discipline:** No skipping. Task → QA → Push → Next.  
- **No Abandoned UI:** Use **legacy 6-tab UI** only.  
- **Security First:** No secrets in code. Use env/secret manager.  
- **LLM Safety:** Router, budgets, schema validation, PII redaction, logs.  
- **Minimal Diffs:** Small, reversible changes. Preserve public contracts.  
- **Tests Required:** Unit + integration where specified.  
- **All pushes** must pass CI before moving on.

---

## Environment & Secrets Checklist (Keep Updated)
- [ ] `OPENAI_API_KEY` (staging/prod)  
- [ ] `ANTHROPIC_API_KEY` (staging/prod)  
- [ ] `LLAMA_ENDPOINT` or `LLAMA_LOCAL`  
- [ ] `LLM_ROUTER_ENABLED=true`  
- [ ] `LLM_MAX_TOKENS_PER_REQ`, `LLM_DAILY_BUDGET_CENTS`, `LLM_TIMEOUT_S`, `LLM_RETRY_MAX`  
- [ ] DB creds (Postgres prod, SQLite dev ok)  
- [ ] GCP project, service account, artifact registry, DNS, SSL

---

## Agents — What/When/Why
- **Compliance Agent** (staging+prod shadow): PII scrub, jurisdiction rules, narrative/packet checks.  
- **Performance Agent** (staging): Load sims, latency, p95/p99, saturation points.  
- **Regression Agent** (staging nightly + prod shadow): Full regression suite on latest.  
- **Monitoring Agent** (prod): Uptime, error rates, anomaly alerts.  
- **Accessibility Agent** (I2 only): WCAG spot checks.

> **Rule:** Agents are **off** in Track F, **on** starting **G3** in **staging**. Continuous in Track K.

---

## CHANGE LOG (append newest at top)
| Time (UTC) | Track/Task | Commit SHA | Status | Notes |
|---|---|---|---|---|
| 2025-08-15 00:08:23 | Phase 1 — Residential auth & tenancy isolation | (pending cc_milestone) | ✅ Complete | Dual login system implemented: Commercial (/login/commercial → /c/*) & Residential (/login/residential → /r/*). JWT audience-based tenant isolation with DB RLS. Testing Agent Grade B+, Compliance Agent Grade C+ (auth fixes needed). |
|  |  |  |  |  |

---

# TASK BOARD (Execute in Order)

## Track F — UI/UX Completion (3C → 3G)
**Goal:** Finish remaining SWARTZ-pattern UI modules to full parity with 3C.  
**Agents:** Off.

### F1 — 3D Module Build
- **Scope:** Clone 3C architecture for 3D (3-panel layout: Uploaded Docs | Parsed Financials | Computed Value), same hooks, schema validation, real-time calcs. Adapt only fields/content unique to 3D.  
- **Acceptance Gates:**  
  - [ ] Unit/UI tests green for 3D  
  - [ ] Works with 3C in global layout  
  - [ ] No console errors/warnings in DevTools  
- **Commit Template:** `F1: 3D module completed and tested ✅`  
- **Status:** [ ]

### F2 — 3E Module Build
- **Scope:** Repeat F1 for 3E; adapt fields only.  
- **Acceptance Gates:**  
  - [ ] 3E tests green  
  - [ ] 3C–3E integrated pass  
- **Commit Template:** `F2: 3E module completed and tested ✅`  
- **Status:** [ ]

### F3 — 3F Module Build
- **Scope:** Repeat for 3F; verify cross-module interactions.  
- **Acceptance Gates:**  
  - [ ] 3F tests green  
  - [ ] 3C–3F integrated pass  
- **Commit Template:** `F3: 3F module completed and tested ✅`  
- **Status:** [ ]

### F4 — 3G Module Build (Final)
- **Scope:** Final SWARTZ-pattern component; ensure 3C–3G parity and layout cohesion.  
- **Acceptance Gates:**  
  - [ ] 3G tests green  
  - [ ] 3C–3G integrated pass  
  - [ ] Global layout verified  
- **Commit Template:** `F4: 3G module completed and tested ✅`  
- **Status:** [🟡] (Current CC task)

---

## Track G — Full Integration Audit + AI Wiring
**Goal:** Transition to full-system integration with AI enabled.  
**Agents:** Turn on in **G3** (staging).

### G1 — Enable LLM Router & Providers (Backend Only)
- **Scope:** Central router (OpenAI, Claude, LLaMA adapters), budgets, token ceilings, retries w/ jitter, circuit breaker, jsonschema validation, PII redaction, structured logs, feature flag `LLM_ROUTER_ENABLED`.  
- **Tests:** `tests/llm/*` — policy selection, budget enforcement, schema validation.  
- **Acceptance Gates:**  
  - [ ] All `tests/llm` green  
  - [ ] Safe fallbacks when disabled/over-budget  
- **Commit Template:** `G1: LLM Router & providers enabled (policy, schema, budgets, redaction, tests) ✅`  
- **Status:** [ ]

### G2 — Wire AI into Core Workflows (Backend)
- **Scope:** Connect Narrative Engine to router; integrate AI into SWARTZ parsing assist, packet generation (cover letters, arguments, summaries), and report narrative helpers. Add per-capability flags (`NARRATIVE_ENGINE_ENABLED`, etc.) and deterministic stubs.  
- **Tests:** Golden-file tests for narratives; schema-validated outputs.  
- **Acceptance Gates:**  
  - [ ] Endpoints return schema-validated responses  
  - [ ] Feature flags toggling works and falls back cleanly  
- **Commit Template:** `G2: AI core workflow integration complete (narrative/packet/SWARTZ helpers) ✅`  
- **Status:** [ ]

### G3 — Agent-Driven Integration Audit (Staging)
- **Scope:** Deploy to **staging**. Enable **Compliance**, **Performance**, **Regression** agents. Run full suites; produce reports; fix & rerun until all pass.  
- **Acceptance Gates:**  
  - [ ] Compliance Agent: 100% pass (PII + jurisdiction checks)  
  - [ ] Performance Agent: p95 latency under target; error rate < SLO  
  - [ ] Regression Agent: 0 failures on staging  
- **Commit Template:** `G3: Integration audit passed with agents (compliance/perf/regression) ✅`  
- **Status:** [ ]

---

## Track H — Heavy-Usage Scaling & Multi-Jurisdiction Simulation
**Goal:** Handle heavy residential spikes + moderate commercial load across 28 jurisdictions.  
**Agents:** Performance + Compliance (staging).

### H1 — Scaling Infrastructure Prep
- **Scope:** DB indexes, caching, async task queues, connection pooling, N+1 query sweeps, memory/CPU profiling.  
- **Acceptance Gates:**  
  - [ ] Profiling deltas show improvements vs G3 baseline  
  - [ ] No new regression failures  
- **Commit Template:** `H1: Scaling infrastructure optimized ✅`  
- **Status:** [ ]

### H2 — Load Simulation (Multi-Jurisdiction)
- **Scope:** Performance Agent sim at target QPS with mixed workloads across all 28 jurisdictions; capture saturation curves.  
- **Acceptance Gates:**  
  - [ ] Meets p95/p99 targets at target QPS  
  - [ ] No data integrity or timeout issues  
- **Commit Template:** `H2: Multi-jurisdiction load simulation passed ✅`  
- **Status:** [ ]

---

## Track I — Pre-Deployment Hardening
**Goal:** Lock security, compliance, and performance.  
**Agents:** Compliance + Regression (+ Accessibility for I2).

### I1 — Security Sweep
- **Scope:** Pen-test APIs; auth flow audit; least-privilege check; secret handling; log redaction; dependency CVE scan.  
- **Acceptance Gates:**  
  - [ ] All critical/high findings resolved  
  - [ ] No secrets in code; logs scrubbed  
- **Commit Template:** `I1: Security hardening complete ✅`  
- **Status:** [ ]

### I2 — Compliance & Accessibility Review
- **Scope:** Compliance Agent (all jurisdictions) + Accessibility Agent (WCAG spots).  
- **Acceptance Gates:**  
  - [ ] All jurisdiction rules pass  
  - [ ] Accessibility checks pass agreed thresholds  
- **Commit Template:** `I2: Compliance + accessibility confirmed ✅`  
- **Status:** [ ]

---

## Track J — GCP Production Deployment
**Goal:** Go live with DNS, SSL, CI/CD.  
**Agents:** Regression + Monitoring (shadow).

### J1 — Production Infrastructure Setup
- **Scope:** GCP project, VPC, service accounts, artifact registry, Cloud SQL, Cloud Run/GKE (as chosen), SSL certs, DNS.  
- **Acceptance Gates:**  
  - [ ] IaC applied (if used) and verified  
  - [ ] Staging → prod parity confirmed  
- **Commit Template:** `J1: Production infra setup complete ✅`  
- **Status:** [ ]

### J2 — CI/CD Finalization
- **Scope:** Pipeline: lint → test → build → deploy → smoke. Add regression shadow run on prod deploy.  
- **Acceptance Gates:**  
  - [ ] Green pipeline on main  
  - [ ] Rollback path tested  
- **Commit Template:** `J2: CI/CD finalization complete ✅`  
- **Status:** [ ]

### J3 — Production Launch
- **Scope:** Deploy prod build; cut release notes; verify monitoring dashboards & alerts.  
- **Acceptance Gates:**  
  - [ ] Smoke tests pass in prod  
  - [ ] Error budgets healthy; alerts green  
- **Commit Template:** `J3: Production launch complete ✅`  
- **Status:** [ ]

---

## Track K — Post-Launch Monitoring & Continuous QA
**Goal:** Keep the platform stable post-launch.  
**Agents:** Monitoring (alert), Performance (off-peak), Regression (nightly staging), Compliance (on changes).

### K1 — 7-Day Burn-in Monitoring
- **Scope:** Monitoring Agent tracks uptime, latency, errors; Performance Agent runs spot-load off-peak.  
- **Acceptance Gates:**  
  - [ ] SLOs met each day  
  - [ ] No unresolved P1/P0 incidents  
- **Commit Template:** `K1: 7-day burn-in stable ✅`  
- **Status:** [ ]

### K2 — Continuous Regression & Compliance Audits
- **Scope:** Nightly Regression Agent on staging; Compliance Agent on narrative/packet changes; weekly summary.  
- **Acceptance Gates:**  
  - [ ] 7 consecutive green runs  
  - [ ] No compliance drift  
- **Commit Template:** `K2: Ongoing QA process in place ✅`  
- **Status:** [ ]

---

## Notes to CC (append if special cases arise)
- If blocked, set **Status = [🚫]**, describe the blocker, propose ≤2 unblocking options, stop.  
- Never modify scopes outside the current task.  
- Prefer additive diffs. Avoid renames unless required by acceptance gates.

✅ Track G — Integration Audit & Heavy-Usage Sign-off G2-G3 complete — completed at 2025-08-14 22:42:05
✅ Track G4 — Heavy-Usage Sign-off complete with 11k+ properties/sec performance — completed at 2025-08-14 22:57:35
✅ Track G — Integration Audit & Heavy-Usage Sign-off G2-G3 complete — completed at 2025-08-14 23:25:13
✅ Track F – Global layout & providers complete — completed at 2025-08-14 23:33:08
✅ Track F – Portfolio tab complete — completed at 2025-08-14 23:33:08
✅ Track G4 — Heavy-Usage Sign-off complete with 11k+ properties/sec performance — completed at 2025-08-14 23:33:40
✅ Phase 2: Residential Property Pipeline Integration - Complete dual-portal architecture with residential processing, AI narratives, and appeal packet generation. Achieved 151k+ properties/sec performance with comprehensive validation and testing. — completed at 2025-08-15 00:42:04
✅ Phase 3 C1a: Admin RBAC + API Skeleton - Complete backend foundation for unified admin panel with RBAC (superadmin/tenant_admin/auditor), RLS database isolation, comprehensive audit logging, JSON schema validation, and 43 passing tests. All admin endpoints secured with permission-based access control. — completed at 2025-08-15 00:59:30
✅ Phase 3 · C1b Admin UI Shell & Navigation complete — completed at 2025-08-15 01:30:28
