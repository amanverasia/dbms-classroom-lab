#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not on PATH. Please install Docker Desktop or Docker Engine."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 ('docker compose') is unavailable. Please update Docker."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Please start Docker Desktop or Docker Engine and try again."
  exit 1
fi

_CONSOLE_PORT="${CONSOLE_PORT:-8080}"
_ADMINER_PORT="${ADMINER_PORT:-8081}"
if [ -f .env ]; then
  _env_console="$(awk -F= '/^[[:space:]]*CONSOLE_PORT[[:space:]]*=/{v=$2} END{sub(/#.*/, "", v); gsub(/[\r"\047[:space:]]/, "", v); print v}' .env)"
  _env_adminer="$(awk -F= '/^[[:space:]]*ADMINER_PORT[[:space:]]*=/{v=$2} END{sub(/#.*/, "", v); gsub(/[\r"\047[:space:]]/, "", v); print v}' .env)"
  [ -n "$_env_console" ] && _CONSOLE_PORT="$_env_console"
  [ -n "$_env_adminer" ] && _ADMINER_PORT="$_env_adminer"
fi

echo "Building and starting DBMS Classroom Lab..."
docker compose up -d --build --wait

echo ""
echo "DBMS Classroom Lab (MSCNS406) is ready!"
echo "  Console (Units 1-4): http://localhost:${_CONSOLE_PORT}"
echo "  Adminer DB UI:       http://localhost:${_ADMINER_PORT}"
echo ""
echo "Stop later with: docker compose down"
