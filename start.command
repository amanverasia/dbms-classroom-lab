#!/bin/zsh
set -e
cd "$(dirname "$0")"
docker compose up -d --wait
# Additive setup also upgrades volumes from the first-lecture release.
docker compose exec -T mariadb mariadb -uroot -pclassroom-root < database/02-classroom.sql
docker compose exec -T mariadb mariadb -uroot -pclassroom-root < database/03-unit2.sql
docker compose exec -T classroom-api php /var/www/classroom/unit2.php
echo ""
echo "DBMS Classroom is ready: Units 1 and 2, with live MariaDB lessons."
echo "Teacher console: http://localhost:8080"
echo "MariaDB Adminer: http://localhost:8081"
echo ""
read -k 1 "?Press any key to close this window..."
