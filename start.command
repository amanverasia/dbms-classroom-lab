#!/bin/zsh
cd "$(dirname "$0")"
docker compose up -d
echo ""
echo "DBMS Classroom Lab is starting in Docker."
echo "Teacher console: http://localhost:8080"
echo "MariaDB Adminer: http://localhost:8081"
echo ""
read -k 1 "?Press any key to close this window..."
