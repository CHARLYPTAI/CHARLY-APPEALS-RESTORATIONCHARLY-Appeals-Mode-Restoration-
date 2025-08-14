# CHARLY v0.9.10 — silent-fetch

**Tag:** v0.9.10-silent-fetch  
**Head SHA:** e10ed413eeacef9bce31ed57b0d5ac0698ba9671

## Highlights
- Silent authentication handling — no user-facing banners when logged out.
- CSP-compliant networking — same-origin URLs; no hardcoded localhost addresses.
- Public `/api/version` no longer requires auth.
- Clean distribution — auth/error strings removed from bundle.
- All smoke tests passing (8/8).

## Artifacts
- `charly_release_v0.9.10_pack.tgz`  
  sha256: `36408aa9b1cb4658906530a6c1912a4f2291d9e26cc49a21db0890851bc36a12`
- `charly_v0.9.10-silent-fetch-lean.zip`  
  sha256: `a58c76060adfc9d69262d2d9145d16a1b34408aa41a3a6ea875e8a5a8c3bb0e5`


## Notes
- Console is quiet on logged-out hard reload.
- Version call uses `authRequired=false` and same-origin fetch.
- Dist free of legacy auth banners/strings.

