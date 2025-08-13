#!/bin/bash
# GITHUB DRAFT RELEASE — create via gh if logged in, otherwise print notes + manual steps

set -euo pipefail

ROOT=~/Desktop/CHARLY_TEST
TAG=v0.9.10-silent-fetch
REL=v0.9.10
PACK_TGZ="$ROOT/charly_release_${REL}_pack.tgz"

cd "$ROOT"

if [[ ! -f "$PACK_TGZ" ]]; then
  echo "ERROR: missing $PACK_TGZ — run the pack step first." >&2
  exit 1
fi

HEAD_SHA=$(git rev-parse HEAD)
NOW_UTC=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPO_URL=$(git remote get-url origin)
TITLE="CHARLY ${REL} — silent-fetch"

# Pull details from release/manifest if present
REL_DIR="$ROOT/release/${REL}"
MANIFEST_JSON="$REL_DIR/manifest.json"
SHA_LINE=""
if [[ -f "$MANIFEST_JSON" ]]; then
  SHA_LINE=$(jq -r '.artifacts[0].sha256' "$MANIFEST_JSON" 2>/dev/null || true)
fi

# Compose release notes
NOTES="**What's in this release**
- Silent logged-out bootstrap (no banners)
- CSP-safe networking (same-origin; no hardcoded 127.0.0.1)
- Public /api/version uses authRequired=false
- Dist hygiene: auth/banner strings removed
- Smoke 8/8 PASS

**Artifacts**
- $(basename "$PACK_TGZ")
- SHA256: ${SHA_LINE:-n/a}

**Meta**
- Tag: ${TAG}
- Commit: ${HEAD_SHA}
- Created: ${NOW_UTC}
- Repo: ${REPO_URL}"

echo "== Checking gh authentication =="
if gh auth status >/dev/null 2>&1; then
  echo "gh logged in — creating DRAFT release…"
  gh release create "$TAG" "$PACK_TGZ" \
    --draft \
    --title "$TITLE" \
    --notes "$NOTES"
  echo "Draft release created for $TAG ✅"
else
  echo "gh not authenticated — printing notes and manual steps instead."
  echo
  echo "==== COPY THIS INTO THE GITHUB RELEASE BODY ===="
  echo "$NOTES"
  echo "==== END NOTES ===="
  echo
  echo "Manual steps:"
  echo "1) Open: $(git remote get-url --push origin | sed 's/.git$//')/releases/new"
  echo "2) Select tag: $TAG"
  echo "3) Upload: $(basename "$PACK_TGZ")"
  echo "4) Title: $TITLE"
  echo "5) Save as Draft (or Publish if ready)"
fi

echo "All set. ✅"