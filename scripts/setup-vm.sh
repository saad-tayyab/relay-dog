#!/bin/bash
# scripts/setup-vm.sh
# One-time setup for Oracle Cloud VM (Ubuntu or Oracle Linux)
set -euo pipefail

echo "🖥️ Setting up Oracle Cloud VM for relay-dog..."

# ─── Detect OS ───
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="${ID}"
  OS_LIKE="${ID_LIKE:-$ID}"
else
  echo "❌ Cannot detect OS. Requires Ubuntu or Oracle Linux." >&2
  exit 1
fi

echo "   Detected: $PRETTY_NAME"

# Set package manager commands based on OS
if [[ "$OS_ID" == "ubuntu" ]] || [[ "$OS_LIKE" == *"debian"* ]]; then
  PKG_UPDATE="sudo apt-get update"
  PKG_INSTALL="sudo apt-get install -y"
  PKG_CLEAN="sudo apt-get clean"
  USE_SNAP=true
elif [[ "$OS_ID" == "ol" ]] || [[ "$OS_ID" == "rhel" ]] || [[ "$OS_ID" == "centos" ]] || [[ "$OS_LIKE" == *"rhel"* ]]; then
  PKG_UPDATE="sudo dnf check-update || true"
  PKG_INSTALL="sudo dnf install -y"
  PKG_CLEAN="sudo dnf clean all"
  USE_SNAP=false
else
  echo "❌ Unsupported OS: $OS_ID. Requires Ubuntu or Oracle Linux." >&2
  exit 1
fi

# ─── System Updates ───
echo "📦 Updating system packages..."
$PKG_UPDATE && $PKG_INSTALL --security update 2>/dev/null || $PKG_UPDATE

# ─── Install Docker ───
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
docker compose version

# ─── Install Certbot ───
echo "🔒 Installing certbot..."
if [ "$USE_SNAP" = true ]; then
  # Ubuntu: snap is recommended
  sudo snap install --classic certbot
  sudo ln -sf /snap/bin/certbot /usr/bin/certbot
else
  # Oracle Linux: dnf
  sudo dnf install -y epel-release 2>/dev/null || true
  $PKG_INSTALL certbot
fi

# ─── Install Dependencies ───
echo "📋 Installing jq and git..."
$PKG_INSTALL jq git

# ─── Directories ───
echo "📁 Creating directories..."
sudo mkdir -p /opt/relay-dog /opt/backups/relay-dog /var/www/certbot /etc/letsencrypt
sudo chown $USER:$USER /opt/relay-dog /opt/backups/relay-dog

# ─── Firewall ───
echo "🔥 Configuring firewall..."
if command -v ufw &>/dev/null; then
  # Ubuntu: UFW
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw --force enable
elif command -v firewall-cmd &>/dev/null; then
  # Oracle Linux: firewalld
  sudo systemctl enable --now firewalld
  sudo firewall-cmd --permanent --add-service=ssh
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --reload
  echo "   Firewall: firewalld configured (ssh, http, https)"
else
  echo "   ⚠️  No firewall found. Install ufw or firewalld manually."
fi

# ─── SSH Hardening ───
echo "🔐 Hardening SSH..."
if [ -f /etc/ssh/sshd_config ]; then
  sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
  sudo systemctl restart sshd
fi

# ─── Certbot Auto-Renewal ───
if [ "$USE_SNAP" = true ]; then
  sudo systemctl enable --now certbot.timer 2>/dev/null || true
  echo "   Certbot auto-renewal: sudo systemctl status certbot.timer"
else
  # Oracle Linux: cron-based renewal
  if ! sudo crontab -l 2>/dev/null | grep -q certbot; then
    (sudo crontab -l 2>/dev/null; echo '0 0 1 * * certbot renew --quiet') | sudo crontab -
  fi
  echo "   Certbot auto-renewal: cron job installed"
fi

# ─── Backup Cron Job (append, don't replace) ───
EXISTING_CRON=$(sudo crontab -l 2>/dev/null || true)
echo "$EXISTING_CRON" | grep -v "relay-dog/scripts/backup-db.sh" | { cat; echo '0 3 * * * /opt/relay-dog/scripts/backup-db.sh >> /var/log/relay-dog-backup.log 2>&1'; } | sudo crontab -

# ─── Log Rotation ───
sudo tee /etc/logrotate.d/docker-containers > /dev/null << 'LOGROTATE'
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
LOGROTATE

# ─── Auto Security Updates (Ubuntu only) ───
if [ "$USE_SNAP" = true ]; then
  sudo apt-get install -y unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
fi

echo ""
echo "✅ VM setup complete."
echo "   ⚠️  Log out and back in for Docker group to take effect."
echo "   Next: clone the repo, create .env, and run docker compose up -d"
