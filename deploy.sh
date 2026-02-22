#!/bin/bash
# ============================================
# ShipMate Deploy Script
# ============================================
# Usage: bash deploy.sh [commit message]
#
# This script:
# 1. Commits and pushes to GitHub
# 2. Triggers Cloud Build to build + deploy
# ============================================

set -e

MESSAGE="${1:-Auto deploy}"

echo "🚀 ShipMate Deploy"
echo "===================="

# Git add, commit, push
echo "📦 Committing changes..."
git add -A
git commit -m "$MESSAGE" || echo "Nothing to commit"

echo "⬆️  Pushing to GitHub..."
git push origin master

echo ""
echo "☁️  Triggering Cloud Build..."
gcloud builds submit --config=cloudbuild.yaml --region=me-west1 --project=dropship-488214 .

echo ""
echo "✅ Deploy complete! Check https://shipmate.store"
