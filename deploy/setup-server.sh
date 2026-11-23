#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 server (any provider, x86 or ARM), run as a normal user with
# sudo (not root) from the cloned repo:  bash deploy/setup-server.sh
# Installs Docker, age, rclone; opens ports 80 / 443 if the image's firewall blocks them; turns on
# automatic security updates (with a reboot at 04:00 UTC when needed); SSH with keys only, no root
# login; adds the cron jobs (DuckDNS every 5 minutes, backup every night at 03:30 UTC). Safe to run again.
set -euo pipefail
deploy_dir="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -eq 0 ]; then
    echo "Run this as your normal user (with sudo), not as root: it turns root logins off." >&2
    exit 1
fi
if [ ! -s "$HOME/.ssh/authorized_keys" ]; then
    echo "$HOME/.ssh/authorized_keys is empty: add your SSH key first, or you'd be locked out (SERVER.md step 3)." >&2
    exit 1
fi

echo "== Packages"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get -y upgrade
sudo DEBIAN_FRONTEND=noninteractive apt-get -y install ca-certificates curl git age rclone unattended-upgrades

echo "== Firewall"
# Some images (Oracle's, for one) block everything but SSH in iptables. Open 80 / 443 there, before
# Docker adds its own rules (saving those too would clash with Docker at boot). Images without such a
# rule need nothing: only SSH and Caddy listen; MySQL and the backend aren't published.
if sudo iptables -S INPUT | grep -q -- '-j REJECT'; then
    sudo DEBIAN_FRONTEND=noninteractive apt-get -y install netfilter-persistent iptables-persistent
    for port in 80 443; do
        sudo iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null ||
            sudo iptables -I INPUT 1 -p tcp -m state --state NEW --dport "$port" -j ACCEPT
    done
    sudo iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
    if ! command -v docker >/dev/null; then sudo netfilter-persistent save; fi
else
    echo "No blocking firewall rules: nothing to open."
fi

echo "== Docker (official repository)"
if ! command -v docker >/dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
        sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo "== Automatic security updates (reboot at 04:00 UTC when one needs it)"
sudo tee /etc/apt/apt.conf.d/52dutchpub-upgrades >/dev/null <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
sudo tee /etc/apt/apt.conf.d/20auto-upgrades >/dev/null <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "== SSH: keys only, no root login"
sudo tee /etc/ssh/sshd_config.d/60-dutchpub.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
sudo sshd -t
sudo systemctl reload ssh || sudo systemctl reload sshd || true

echo "== Scripts and cron jobs"
chmod +x "$deploy_dir"/*.sh
mkdir -p "$deploy_dir/backups"
crontab_lines="*/5 * * * * $deploy_dir/duckdns.sh >>$deploy_dir/backups/duckdns.log 2>&1
30 3 * * * $deploy_dir/backup.sh >>$deploy_dir/backups/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v "$deploy_dir/" || true; echo "$crontab_lines" ) | crontab -

echo
echo "Done. Log out and back in (for the docker group), then continue with SERVER.md step 6."
