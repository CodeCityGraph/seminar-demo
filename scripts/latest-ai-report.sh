#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AI_ROOT="$ROOT_DIR/pipeline/reports/ai"

if [[ ! -f "$AI_ROOT/latest-manifest.json" ]]; then
  echo "No AI report found yet. Run: npm run ai:generate-tests"
  exit 1
fi

MANIFEST="$AI_ROOT/latest-manifest.json"
RUN_ID="$(node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(m.runId||'unknown');" "$MANIFEST")"
REPORT_DIR="$AI_ROOT/$RUN_ID"

echo "Latest AI run: $RUN_ID"
echo "Manifest: $REPORT_DIR/manifest.json"
echo "Summary: $REPORT_DIR/summary.md"
echo "Prompt: $REPORT_DIR/prompt.txt"
echo "Raw model response: $REPORT_DIR/raw-response.txt"
echo "AI pipeline summary: $REPORT_DIR/ai-pipeline-summary.md"
echo "Targeted AI HTML report: $REPORT_DIR/generated-tests/html/index.html"
