#!/bin/bash
# Bootstraps Claude Code session with CHARLY context

PROJECT_DIR="$HOME/Desktop/CHARLY_TEST"

if command -v code >/dev/null 2>&1; then
  code --new-window "$PROJECT_DIR"
else
  open -a "Visual Studio Code" "$PROJECT_DIR"
fi

echo "Opened CHARLY_TEST in VS Code. Paste the MASTER HANDOFF PROMPT into Claude Code in the new window."
