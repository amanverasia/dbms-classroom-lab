#!/bin/zsh
set -e
cd "$(dirname "$0")"
docker compose up -d --wait
# Additive setup also upgrades volumes from the first-lecture release.
docker compose exec -T mariadb mariadb -uroot -pclassroom-root < database/02-classroom.sql
echo ""
echo "DBMS Classroom is ready: Unit 1, 9 sections, 49 teaching steps."
echo "Teacher console: http://localhost:8080"
echo "MariaDB Adminer: http://localhost:8081"
echo ""
read -k 1 "?Press any key to close this window..."
