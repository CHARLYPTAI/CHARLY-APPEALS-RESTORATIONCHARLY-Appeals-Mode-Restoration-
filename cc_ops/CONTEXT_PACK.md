# Context Pack

## Business Constraints

* No free full appeal for single-property owners (subscriber-only freebie ok)
* No contingency services
* No platform-provided comps; user-supplied only; not shared
* Recognize Over/Fair/Under; warn on reassessment risk
* Monetize truthfully; no fluff
* Offer e-file only where safe API exists; avoid actions that risk API lockout
* Generate anonymized aggregate insights for lead products; opt-out honored

## Technical Constraints

* Monorepo: pnpm (TS) + Poetry (Py)
* Packages: core-engine, finance, contracts, file-processor; apps: api, commercial-app, residential-app
* CI: GitHub Actions; coverage ≥80% global; Decision/Finance 100%; docs build strict; governance checks (no-drift)

## Open Questions (log blockers only)

* Comp providers' ToS & ML training restrictions (MLS/CoStar)
* Jurisdiction e-file API policies (lockout risk)