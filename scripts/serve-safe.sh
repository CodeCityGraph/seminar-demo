#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAFE_DIR="$ROOT_DIR/safe/current"

if [[ ! -d "$SAFE_DIR" ]]; then
  echo "safe/current does not exist yet. Run: npm run pipeline:local"
  exit 1
fi

PORT="${PORT:-3001}"
STATIC_DIR="$SAFE_DIR" PORT="$PORT" node "$ROOT_DIR/mock-api.js"
