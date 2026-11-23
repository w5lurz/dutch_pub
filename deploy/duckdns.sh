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

# Stray characters (a carriage return, a pasted escape sequence) would break the URL, and curl's error
# message would print the token into the cron log. Check the shape first.
if ! [[ "$DUCKDNS_SUBDOMAIN" =~ ^[a-z0-9-]+$ ]]; then
    echo "DUCKDNS_SUBDOMAIN in deploy/.env has unexpected characters (only the part before .duckdns.org)." >&2
    exit 1
fi
if ! [[ "$DUCKDNS_TOKEN" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    echo "DUCKDNS_TOKEN in deploy/.env doesn't look like a DuckDNS token (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)." >&2
    exit 1
fi

# Empty ip= : DuckDNS takes the address the request comes from (IPv4 forced: -4). The URL (with the token) reaches curl
# through stdin as a config, not on the command line (visible to every process). curl's own error messages
# would show the URL, so they are dropped. The answer is OK or KO.
if ! answer=$(curl -4 -fs -m 15 -K - 2>/dev/null <<EOF
url = "https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip="
EOF
); then
    echo "DuckDNS update failed: no answer from duckdns.org (network or DNS problem)." >&2
    exit 1
fi
if [ "$answer" != "OK" ]; then
    echo "DuckDNS update failed: $answer" >&2
    exit 1
fi
