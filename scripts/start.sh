#!/usr/bin/env bash
# Convenience launcher for the Partnership AI Agent (n8n).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env found. Copying from .env.example — edit it, then re-run."
  cp .env.example .env
  exit 1
fi

echo "Starting n8n..."
docker compose up -d

# Reflect the actual host port (configurable via N8N_PORT_HOST in .env; defaults to 5678)
PORT="$(grep -E '^N8N_PORT_HOST=' .env | tail -1 | cut -d= -f2)"
PORT="${PORT:-5678}"
echo "n8n is starting at http://localhost:${PORT}"
echo "Next: create credentials + import the 6 workflows in workflows/ (see README)."
