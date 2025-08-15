#!/bin/bash
TASK="$*"
DATE=$(date +"%Y-%m-%d %H:%M:%S")
echo "✅ $TASK — completed at $DATE" >> ~/Desktop/CHARLY_TEST/PROGRESS_TRACKER.md
echo "Logged completion: $TASK"
