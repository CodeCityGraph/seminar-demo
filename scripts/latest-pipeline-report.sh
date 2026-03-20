#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/pipeline/reports"

if [[ ! -d "$REPORTS_DIR" ]]; then
  echo "No pipeline reports found yet. Run: npm run pipeline:local"
  exit 1
fi

LATEST_RUN="$(ls -1t "$REPORTS_DIR" | head -n 1 || true)"
if [[ -z "$LATEST_RUN" ]]; then
  echo "No pipeline runs found yet. Run: npm run pipeline:local"
  exit 1
fi

BASE="$REPORTS_DIR/$LATEST_RUN"

echo "Latest run: $LATEST_RUN"
echo "Summary: $BASE/summary.md"
echo "AI-generated report: $BASE/ai-generated/html/index.html"
echo "Smoke report: $BASE/smoke/html/index.html"
echo "Forms/validation report: $BASE/forms-validation/html/index.html"
echo "Theme/state/navigation report: $BASE/theme-state-navigation/html/index.html"
echo "Accessibility report: $BASE/accessibility/html/index.html"
