#!/usr/bin/env bash
# Restores a backup into the running database (REPLACES the current data).
#   ./restore.sh <backup file .sql.gz.age> <age private key file>
# Get the file from B2 first, e.g.:  rclone copy b2:dutchpub-backups/<name> .
# The private key comes from your password manager: put it in a file for the restore, delete it after.
set -euo pipefail
cd "$(dirname "$0")"
backup="${1:?usage: ./restore.sh <backup .sql.gz.age> <age key file>}"
key="${2:?usage: ./restore.sh <backup .sql.gz.age> <age key file>}"
case "$backup" in /*) ;; *) backup="$OLDPWD/$backup" ;; esac
case "$key" in /*) ;; *) key="$OLDPWD/$key" ;; esac

read -r -p "This replaces the database with $(basename "$backup"). Type yes to go on: " answer
[ "$answer" = "yes" ] || exit 1

# The backend is stopped meanwhile (it would write snapshots into a half-restored database).
docker compose -f docker-compose.prod.yml stop app
age -d -i "$key" "$backup" | gunzip |
    docker compose -f docker-compose.prod.yml exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot "$MYSQL_DATABASE"'
docker compose -f docker-compose.prod.yml start app
echo "Restored. Check: curl -s https://\$DOMAIN/api/health"
