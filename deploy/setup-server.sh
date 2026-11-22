#!/usr/bin/env bash
# One-time setup of a fresh Oracle Cloud Ubuntu VM (24.04, ARM or x86), run as the default `ubuntu`
# user from the cloned repo:  bash deploy/setup-server.sh
# Installs Docker, age, rclone; opens ports 80 / 443 in the VM's own firewall; turns on automatic
# security updates (with a reboot at 04:00 when needed); adds the cron jobs (DuckDNS every 5 minutes,
# backup every night at 03:30 UTC). Safe to run again.
set -euo pipefail
deploy_dir="$(cd "$(dirname "$0")" && pwd)"

echo "== Packages"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get -y upgrade
sudo DEBIAN_FRONTEND=noninteractive apt-get -y install ca-certificates curl git age rclone unattended-upgrades netfilter-persistent iptables-persistent

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

echo "== Firewall: ports 80 and 443"
# Oracle's Ubuntu images block everything but SSH in iptables (on top of the VCN security list,
# which must allow 80 / 443 too: DEPLOY-ORACLE.md). Inserted at the top, before their final REJECT rule.
for port in 80 443; do
    if ! sudo iptables -C INPUT -p tcp -m state --state NEW --dport "$port" -j ACCEPT 2>/dev/null; then
        sudo iptables -I INPUT 1 -p tcp -m state --state NEW --dport "$port" -j ACCEPT
    fi
done
if ! sudo iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
fi
sudo netfilter-persistent save

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

echo "== SSH: keys only"
# Oracle's images already refuse passwords; this makes sure.
sudo tee /etc/ssh/sshd_config.d/60-dutchpub.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
sudo systemctl reload ssh || sudo systemctl reload sshd || true

echo "== Scripts and cron jobs"
chmod +x "$deploy_dir"/*.sh
mkdir -p "$deploy_dir/backups"
crontab_lines="*/5 * * * * $deploy_dir/duckdns.sh >>$deploy_dir/backups/duckdns.log 2>&1
30 3 * * * $deploy_dir/backup.sh >>$deploy_dir/backups/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v "$deploy_dir/" || true; echo "$crontab_lines" ) | crontab -

echo
echo "Done. Log out and back in (for the docker group), then continue with DEPLOY-ORACLE.md step 6."
