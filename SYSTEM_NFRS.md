# System NFRs & SLOs

* Availability: 99.9% monthly uptime (≤1h/mo maintenance)
* Latency (P50/P95): Reads ≤150/500ms; Validations ≤400/900ms for ≤1MB payloads
* Throughput: sustain 50 RPS burst; autoscale target
* Retention: uploads 18mo; derived 36mo; logs 30d (no PII)
* Privacy: no PII in logs; encrypt at rest (SSE-KMS) + in transit (TLS 1.2+)
* Security: OWASP Top 10 mitigations; tenant object namespaces; signed URLs
* Access: RBAC (Owner/Contributor/Viewer), scoped tokens; admin audit log
* Observability: metrics, logs, traces; error budgets per service
* Rate limits: 100 req/min/token; 10 concurrent file jobs/user
* Backups: daily; RPO ≤24h; RTO ≤4h
* Compliance: evidence-ready; no resale of comps