#!/usr/bin/env bash
# Points the DuckDNS name at this server's public address (cron every 5 minutes, see setup-server.sh).
# Oracle keeps the address while the VM exists, so this mostly confirms it; it matters if the address
# ever changes (a new VM, a stop / start with an ephemeral address).
set -euo pipefail
cd "$(dirname "$0")"
set -a
# shellcheck disable=SC1091
. ./.env
set +a
: "${DUCKDNS_SUBDOMAIN:?set DUCKDNS_SUBDOMAIN in deploy/.env}"
: "${DUCKDNS_TOKEN:?set DUCKDNS_TOKEN in deploy/.env}"

# Empty ip= : DuckDNS takes the address the request comes from. The URL (with the token) reaches curl
# through stdin as a config, not on the command line (visible to every process). The answer is OK or KO.
answer=$(curl -fsS -m 15 -K - <<EOF
url = "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip="
EOF
)
if [ "$answer" != "OK" ]; then
    echo "DuckDNS update failed: $answer" >&2
    exit 1
fi
