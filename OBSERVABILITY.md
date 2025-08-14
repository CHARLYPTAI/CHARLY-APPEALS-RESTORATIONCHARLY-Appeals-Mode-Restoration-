# Observability & Ops

* Metrics: request_count/duration, validation_failures, ocr_time, parse_success_rate, packet_render_time
* Tracing: W3C tracecontext across web/API/worker
* Logging: structured JSON; PII redaction; sample 1% of 2xx, 100% of 4xx/5xx
* Alerts: P95>SLO 15m; error>2%; queue backlog age>10m; OCR error>5%
* Runbooks: parser failure spike; OCR backlog; S3 403s