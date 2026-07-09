#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export WRANGLER_HOME="$ROOT/.wrangler-home"
export XDG_CONFIG_HOME="$ROOT/.wrangler-home"
mkdir -p "$WRANGLER_HOME"/{logs,registry}

set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a

pkill -f 'wrangler.*8787' 2>/dev/null || true
pkill -f 'workerd serve' 2>/dev/null || true
sleep 1

LOG=/tmp/wrangler-smoke.log
rm -f "$LOG"
cd "$ROOT/apps/web"
bunx wrangler dev --port 8787 --ip 127.0.0.1 --var SITE_URL:http://127.0.0.1:8787 >"$LOG" 2>&1 &
WPID=$!
cleanup() {
  kill "$WPID" 2>/dev/null || true
  pkill -f 'wrangler.*8787' 2>/dev/null || true
}
trap cleanup EXIT

echo "wrangler pid $WPID"
for i in $(seq 1 90); do
  if rg -q 'Ready on' "$LOG" 2>/dev/null; then
    echo "ready after ${i}s"
    break
  fi
  if ! kill -0 "$WPID" 2>/dev/null; then
    echo "wrangler died"
    tail -80 "$LOG"
    exit 1
  fi
  sleep 1
done

export SITE_URL=http://127.0.0.1:8787
cd "$ROOT"
bun scripts/smoke-workers-partner-logo.ts
