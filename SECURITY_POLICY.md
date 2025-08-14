# Security Policy

* Auth: OAuth2 Device Code or email-link; Commercial requires SSO/SAML; short-lived JWT + refresh rotation; CSRF on web
* Secrets: Vault/SM; GitHub OIDC for deploy; no secrets in repo
* Abuse: request size caps; content-type allowlist; image bomb detection; PDF sandbox; AV fail-closed
* SAST: CodeQL + npm/yarn audit + pip-audit (weekly)
* DAST: ZAP baseline on PRs touching API
* RBAC: org-scoped roles; audit on permission changes