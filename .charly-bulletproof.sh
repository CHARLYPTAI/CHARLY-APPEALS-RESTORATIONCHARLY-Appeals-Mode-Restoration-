#!/bin/bash
# 🛡️ CHARLY BULLETPROOF RECOVERY SYSTEM
# Prevents dashboard loss through automatic saves

BRANCH_NAME="dashboard-working-$(date +%Y%m%d)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Auto-save function
auto_save() {
    echo "🛡️ Auto-saving CHARLY dashboard..."
    git add .
    git commit -m "🛡️ AUTO-SAVE: Dashboard state $TIMESTAMP" || echo "No changes to save"
    git push origin $(git branch --show-current) 2>/dev/null || echo "Push skipped"
    echo "✅ Dashboard saved at $TIMESTAMP"
}

# Create/switch to working branch
if ! git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    git checkout -b $BRANCH_NAME
    echo "✅ Created working branch: $BRANCH_NAME"
else
    git checkout $BRANCH_NAME
    echo "✅ Switched to working branch: $BRANCH_NAME"
fi

# Initial save
auto_save

# Setup auto-save every 5 minutes
while true; do
    sleep 300  # 5 minutes
    auto_save
done