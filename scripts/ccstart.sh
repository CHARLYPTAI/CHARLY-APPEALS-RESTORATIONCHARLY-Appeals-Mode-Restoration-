#!/usr/bin/env bash
set -euo pipefail

# Move to repo root
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

# 1) Verify BOOTSTRAP guardrail
if [ ! -f BOOTSTRAP.md ] || [ ! -f .bootstrap_hash ]; then
  echo "❌ BOOTSTRAP.md or .bootstrap_hash missing. Aborting."
  exit 1
fi
EXPECTED_HASH="$(cat .bootstrap_hash)"
CURRENT_HASH="$(shasum -a 256 BOOTSTRAP.md | awk '{print $1}')"
if [ "$EXPECTED_HASH" != "$CURRENT_HASH" ]; then
  echo "❌ BOOTSTRAP.md hash mismatch."; echo "Expected: $EXPECTED_HASH"; echo "Current : $CURRENT_HASH"; exit 1
fi

# 2) Copy micro-prompt to clipboard
pbcopy < BOOTSTRAP.md

# 3) Open a new Claude Code chat in VS Code
open -a "Visual Studio Code" --args --command workbench.action.chat.start

# 4) Paste + send (macOS)
sleep 1.5
osascript -e 'tell application "System Events" to keystroke (the clipboard)'
osascript -e 'tell application "System Events" to key code 36'  # Return

echo "✅ CC launched with guardrails. Executing next [READY] task…"