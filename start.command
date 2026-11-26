#!/bin/sh
set -eu
cd "$(dirname "$0")"

sh ./start.sh

printf "\nPress Return to close this window..."
read -r _unused || true
