#!/bin/bash

# ─────────────────────────────────────────────
#  Tableside — one-click deploy to Netlify
#  Usage: double-click deploy.sh  OR  run ./deploy.sh
# ─────────────────────────────────────────────

# Move to the folder this script lives in
cd "$(dirname "$0")"

echo ""
echo "🍽  Tableside Deploy"
echo "────────────────────────────────"

# Check git is installed
if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed. Download it at https://git-scm.com"
  read -p "Press Enter to exit..."
  exit 1
fi

# Check there's a git repo here
if [ ! -d ".git" ]; then
  echo "❌ No git repo found. Run the first-time setup first:"
  echo "   git init && git remote add origin YOUR_GITHUB_URL"
  read -p "Press Enter to exit..."
  exit 1
fi

# Optional: ask for a custom commit message
echo ""
read -p "📝 Commit message (press Enter for default): " MSG
if [ -z "$MSG" ]; then
  MSG="Update from Claude — $(date '+%b %d %Y %I:%M %p')"
fi

echo ""
echo "📦 Staging all changes..."
git add .

echo "💾 Committing: \"$MSG\""
git commit -m "$MSG"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "────────────────────────────────"
echo "✅ Done! Netlify is deploying your update."
echo "   Check your Netlify dashboard for the live URL."
echo ""
read -p "Press Enter to close..."
