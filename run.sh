#!/usr/bin/env bash
# Start Ollama, the FastAPI backend, and the Next.js app.
# Ctrl+C stops only the processes this script started.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
API_PORT=8000
WEB_PORT=3001
OLLAMA_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3:8b}"

STARTED=()

listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

stop_tree() {
  local pid="$1"
  local child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    stop_tree "$child"
  done
  kill -TERM "$pid" 2>/dev/null || true
}

stop_started() {
  local pid
  for pid in "${STARTED[@]+"${STARTED[@]}"}"; do
    stop_tree "$pid"
  done
}

trap stop_started EXIT INT TERM

wait_for() {
  local url="$1"
  local label="$2"
  local i
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "$label did not answer at $url" >&2
  exit 1
}

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Install it from https://ollama.com and run this again." >&2
  exit 1
fi

if curl -sf "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
  echo "Ollama is already running."
else
  echo "Starting Ollama..."
  set -m
  ollama serve >/tmp/finshield-ollama.log 2>&1 &
  STARTED+=($!)
  set +m
  wait_for "$OLLAMA_URL/api/tags" "Ollama"
fi

if ! ollama list 2>/dev/null | awk 'NR > 1 { print $1 }' | grep -qx "$OLLAMA_MODEL"; then
  echo "Pulling $OLLAMA_MODEL (first time only)..."
  ollama pull "$OLLAMA_MODEL"
fi

if listening "$API_PORT"; then
  echo "API is already running on port $API_PORT."
else
  if [[ ! -x "$ROOT/backend/.venv/bin/uvicorn" ]]; then
    echo "Creating the Python environment..."
    python3 -m venv "$ROOT/backend/.venv"
    "$ROOT/backend/.venv/bin/pip" install fastapi 'uvicorn[standard]' pydantic
  fi
  echo "Starting the API..."
  set -m
  (
    cd "$ROOT/backend"
    exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$API_PORT"
  ) >/tmp/finshield-api.log 2>&1 &
  STARTED+=($!)
  set +m
  wait_for "http://127.0.0.1:$API_PORT/health" "API"
fi

if listening "$WEB_PORT"; then
  echo "App is already running on port $WEB_PORT."
else
  if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
    echo "Installing frontend packages..."
    (cd "$ROOT/frontend" && npm install)
  fi
  echo "Starting the app..."
  set -m
  (
    cd "$ROOT/frontend"
    exec npm run dev -- --port "$WEB_PORT"
  ) >/tmp/finshield-web.log 2>&1 &
  STARTED+=($!)
  set +m
  wait_for "http://127.0.0.1:$WEB_PORT" "App"
fi

echo
echo "Ollama   $OLLAMA_URL   model $OLLAMA_MODEL"
echo "API      http://127.0.0.1:$API_PORT"
echo "App      http://127.0.0.1:$WEB_PORT"
echo

if [[ ${#STARTED[@]} -eq 0 ]]; then
  exit 0
fi

echo "Logs: /tmp/finshield-ollama.log  /tmp/finshield-api.log  /tmp/finshield-web.log"
echo "Press Ctrl+C to stop what this script started."

while true; do
  for pid in "${STARTED[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "A process exited. Stopping the rest." >&2
      exit 1
    fi
  done
  sleep 1
done
