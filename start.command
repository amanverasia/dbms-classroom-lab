#!/bin/sh
set -eu
cd "$(dirname "$0")"
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin"

status=0
sh ./start.sh || status=$?

printf "\nPress Return to close this window..."
read -r _unused || true
exit "$status"
