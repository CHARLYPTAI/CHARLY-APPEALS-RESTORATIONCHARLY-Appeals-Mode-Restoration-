#!/bin/bash
# 🛡️ BULLETPROOF AUTO-COMMIT SYSTEM
# Commits and pushes every 5 minutes during development

while true; do
    # Check if files have changed
    if [[ -n $(git status --porcelain) ]]; then
        TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
        echo "🛡️ Auto-committing changes at $TIMESTAMP"
        
        git add .
        git commit -m "🛡️ AUTO-COMMIT: $TIMESTAMP"
        git push origin $(git branch --show-current) --quiet
        
        echo "✅ Changes committed and pushed to GitHub"
    else
        echo "✅ No changes to commit at $(date +"%H:%M:%S")"
    fi
    
    # Wait 5 minutes (300 seconds)
    sleep 300
done