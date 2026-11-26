#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Please start Docker Desktop or Docker Engine and try again."
  exit 1
fi

CONSOLE_PORT="${CONSOLE_PORT:-8080}"
ADMINER_PORT="${ADMINER_PORT:-8081}"
if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a
  . ./.env
  set +a
fi

echo "Building and starting DBMS Classroom Lab..."
docker compose up -d --build --wait

echo ""
echo "DBMS Classroom Lab (MSCNS406) is ready!"
echo "  Console (Units 1-4): http://localhost:${CONSOLE_PORT:-8080}"
echo "  Adminer DB UI:       http://localhost:${ADMINER_PORT:-8081}"
echo ""
echo "Stop later with: docker compose down"
