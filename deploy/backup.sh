#!/usr/bin/env bash
# Nightly database backup (cron, see setup-server.sh): dump -> gzip -> encrypt (age, public key only)
# -> copy to Backblaze B2 (rclone) -> keep 14 days on the server -> ping the Better Stack heartbeat.
# Any failure stops the script before the ping, so a missing ping = a failed backup = an alert.
# Run by hand:  ./backup.sh
set -euo pipefail
cd "$(dirname "$0")"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${BACKUP_AGE_RECIPIENT:?set BACKUP_AGE_RECIPIENT in deploy/.env}"
: "${BACKUP_REMOTE:?set BACKUP_REMOTE in deploy/.env}"

mkdir -p backups
file="backups/dutch_pub-$(date -u +%Y-%m-%dT%H%MZ).sql.gz.age"

# --single-transaction: a consistent dump without stopping the game. The password goes in through the
# environment, not the command line (visible to every process).
docker compose -f docker-compose.prod.yml exec -T db sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --no-tablespaces --routines --triggers "$MYSQL_DATABASE"' |
    gzip -9 | age -r "$BACKUP_AGE_RECIPIENT" >"$file.part"
mv "$file.part" "$file"

# Off the server. The B2 key may only write (not delete): old copies are removed by the bucket's
# lifecycle rule (SERVER.md step 9), so a stolen key can't wipe the backups.
rclone copy --no-check-dest "$file" "$BACKUP_REMOTE"

find backups -name '*.sql.gz.age' -mtime +14 -delete

if [ -n "${BACKUP_HEARTBEAT_URL:-}" ]; then
    curl -fsS -m 10 --retry 3 "$BACKUP_HEARTBEAT_URL" >/dev/null
fi
echo "Backup done: $file ($(du -h "$file" | cut -f1))"
