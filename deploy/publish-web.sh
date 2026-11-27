#!/usr/bin/env bash
# Builds the web version of the app on this PC and copies it to the server's deploy/web folder,
# which Caddy serves at WEB_DOMAIN (see Caddyfile). Run from Git Bash (Windows) or any shell:
#
#   deploy/publish-web.sh dutchpub                          # an ssh config entry (SERVER.md)
#   deploy/publish-web.sh dutchpub@1.2.3.4 -i ~/.ssh/dutchpub
#
# API_URL (default https://dutchpub.eu) is the backend the web version talks to. The server needs
# no restart: the new files are served at once (browsers pick them up on their next load).
set -euo pipefail

host="${1:?usage: publish-web.sh <ssh host> [ssh options...]}"
shift
api_url="${API_URL:-https://dutchpub.eu}"
mobile="$(cd "$(dirname "$0")/../mobile" && pwd)"

echo "== Building the web version for $api_url"
cd "$mobile"
npm run build:shared >/dev/null
rm -rf dist-web
# The address comes from here, not from .env.local (that one is for development).
EXPO_PUBLIC_API_URL="$api_url" npx expo export --platform web --output-dir dist-web --clear >/dev/null
test -f dist-web/index.html

echo "== Copying it to $host:~/dutch_pub/deploy/web"
# Unpacked next to the live files first, then swapped in file by file: the folder itself stays
# (Caddy's container has it mounted), and the site is never half-copied for long.
tar -C dist-web -czf - . | ssh "$@" "$host" '
    set -e
    web=~/dutch_pub/deploy/web
    mkdir -p "$web" "$web.new"
    find "$web.new" -mindepth 1 -delete
    tar -C "$web.new" -xzf -
    find "$web" -mindepth 1 -delete
    cp -a "$web.new"/. "$web"/
    rm -rf "$web.new"
    echo "Published: $(du -sh "$web" | cut -f1)"
'
