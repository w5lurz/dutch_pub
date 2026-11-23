#!/usr/bin/env bash
# Points the DuckDNS name at this server's public address (cron every 5 minutes, see setup-server.sh).
# A rented server keeps its address, so this mostly confirms it; it matters if the address ever changes
# (a new server, a move to another provider).
set -euo pipefail
cd "$(dirname "$0")"
set -a
# shellcheck disable=SC1091
. ./.env
set +a
: "${DUCKDNS_SUBDOMAIN:?set DUCKDNS_SUBDOMAIN in deploy/.env}"
: "${DUCKDNS_TOKEN:?set DUCKDNS_TOKEN in deploy/.env}"

# Empty ip= : DuckDNS takes the address the request comes from (IPv4 forced: -4). The URL (with the token) reaches curl
# through stdin as a config, not on the command line (visible to every process). The answer is OK or KO.
answer=$(curl -4 -fsS -m 15 -K - <<EOF
url = "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip="
EOF
)
if [ "$answer" != "OK" ]; then
    echo "DuckDNS update failed: $answer" >&2
    exit 1
fi
