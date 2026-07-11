#!/usr/bin/env bash
# One-shot remote branch cleanup — run this yourself (needs your GitHub auth,
# which VSCode has and Claude's shell doesn't).
#
# Everything deleted below is preserved forever as archive/* tags, which this
# script pushes FIRST. Recover any of them any time with:
#   git checkout archive/<name>
set -euo pipefail

echo "1/3 pushing main + archive tags…"
git push origin main --tags

echo "2/3 deleting stale remote branches (all tagged as archive/*)…"
git push origin --delete \
  copilot/add-chat-persistence-db-redis \
  copilot/add-game-state-schema \
  copilot/add-keys-to-redis \
  copilot/add-map-editor-page \
  copilot/add-navigation-pane-component \
  copilot/add-save-insert-feature-chat \
  copilot/add-ux-improvements-tts-profile \
  copilot/create-3d-visualization-engine \
  copilot/create-interactive-course-system \
  copilot/create-modular-engine-structure \
  copilot/fix-17 \
  copilot/fix-4bc22f29-a30c-4e8c-bd95-71995c5cbde0 \
  copilot/fix-653777a5-46eb-4fba-9bd4-ddf93f3847e2 \
  copilot/implement-meta-features \
  copilot/implement-new-gameplay-features \
  copilot/manage-growth-strategies \
  revert-last-commits \
  shawn \
  dependabot/npm_and_yarn/husky-9.1.6 \
  dependabot/npm_and_yarn/lint-staged-15.2.10 \
  dependabot/npm_and_yarn/prettier-3.3.3 \
  dependabot/npm_and_yarn/rehype-katex-7.0.1 \
  dependabot/npm_and_yarn/remark-breaks-4.0.0

echo "3/3 pruning local refs…"
git fetch --all --prune

echo "done — branch picker should show only main now."
