#!/bin/bash
set -euo pipefail

TAG="v0.9.10-silent-fetch"
TITLE="CHARLY v0.9.10 — silent-fetch"
NOTES="RELEASE_NOTES_v0.9.10-silent-fetch.md"
ASSETS=("charly_release_v0.9.10_pack.tgz" "charly_v0.9.10-silent-fetch-lean.zip")

echo "== Verify prerequisites =="
command -v gh >/dev/null || { echo "❌ GitHub CLI (gh) not installed"; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null

echo "== Check gh auth =="
if ! gh auth status >/dev/null 2>&1; then
  echo "🔑 Not authenticated. Please run 'gh auth login' first"
  exit 1
fi

echo "== Resolve repo =="
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repo: $REPO"

echo "== Verify tag exists on origin =="
git fetch --tags origin >/dev/null
git show-ref --tags --verify --quiet "refs/tags/$TAG" || { echo "❌ Tag $TAG not found. Push it first: git push origin $TAG"; exit 1; }

echo "== Verify artifacts and notes files exist =="
for f in "${ASSETS[@]}" "$NOTES"; do
  [[ -f "$f" ]] || { echo "❌ Missing file: $f"; exit 1; }
done

echo "== Create or update DRAFT release =="
if gh release view "$TAG" -R "$REPO" >/dev/null 2>&1; then
  echo "ℹ️ Release exists; converting to draft + updating title/notes…"
  gh release edit "$TAG" -R "$REPO" --draft=true --title "$TITLE" --notes-file "$NOTES"
else
  echo "🆕 Creating draft release…"
  gh release create "$TAG" -R "$REPO" --draft --title "$TITLE" --notes-file "$NOTES"
fi

echo "== Upload assets (clobber if re-run) =="
gh release upload "$TAG" -R "$REPO" "${ASSETS[@]}" --clobber

echo "== Show release summary =="
gh release view "$TAG" -R "$REPO" --json name,tagName,isDraft,url,assets --jq \
  '{name:.name, tag:.tagName, draft:.isDraft, url:.url, assets:[.assets[].name]}'

echo "== Done =="
echo "Rollback (delete draft release only): gh release delete $TAG -R $REPO -y   # tag remains"