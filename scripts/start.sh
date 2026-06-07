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
echo "n8n is starting at http://localhost:5678"
echo "Next: create credentials + import the 5 workflows in workflows/ (see README)."
