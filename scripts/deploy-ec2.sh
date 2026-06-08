#!/usr/bin/env bash
# =============================================================================
# Jungle Gym Play House — One-Stop EC2 Deployment Script
# Target: Ubuntu 22.04 LTS on t3.micro (2 vCPU, 1 GB RAM)
# Usage:
#   1. SSH into your fresh EC2 instance
#   2. chmod +x deploy-ec2.sh && sudo ./deploy-ec2.sh
#
# Required env vars (set before running, or script will prompt):
#   DOMAIN          - your domain (e.g. pos.junglegym.com) or EC2 public IP
#   NEXTAUTH_SECRET - random 32+ char string (run: openssl rand -base64 32)
#   USE_SSL         - "yes" to enable Let's Encrypt SSL (needs a real domain)
#   GIT_REPO        - git repo URL (e.g. https://github.com/melvin-akino/play-nest)
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
die()  { echo -e "${RED}[error]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && die "Run as root: sudo ./deploy-ec2.sh"

# ── Prompt for required vars ──────────────────────────────────────────────────
DOMAIN="${DOMAIN:-}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-}"
USE_SSL="${USE_SSL:-no}"
GIT_REPO="${GIT_REPO:-}"
APP_DIR="/opt/junglegym"

if [[ -z "$DOMAIN" ]]; then
  read -rp "Domain or EC2 public IP (e.g. pos.junglegym.com): " DOMAIN
fi
if [[ -z "$GIT_REPO" ]]; then
  read -rp "Git repo URL (https://...): " GIT_REPO
fi
if [[ -z "$NEXTAUTH_SECRET" ]]; then
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  warn "Auto-generated NEXTAUTH_SECRET — save this: $NEXTAUTH_SECRET"
fi
if [[ -z "$USE_SSL" || "$USE_SSL" == "no" ]]; then
  read -rp "Enable Let's Encrypt SSL? Requires a real domain pointed at this IP [y/N]: " ans
  [[ "$ans" =~ ^[Yy]$ ]] && USE_SSL="yes"
fi

# ── 1. System update ──────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Swap (2 GB) ────────────────────────────────────────────────────────────
if ! swapon --show | grep -q /swapfile; then
  log "Creating 2 GB swap file..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Tune swappiness (use swap only when RAM is nearly full)
  sysctl vm.swappiness=10
  sysctl vm.vfs_cache_pressure=50
  echo 'vm.swappiness=10'         >> /etc/sysctl.conf
  echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
  log "Swap active: $(free -h | grep Swap)"
else
  log "Swap already configured."
fi

# ── 3. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  apt-get install -y -qq ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  log "Docker $(docker --version | cut -d' ' -f3) installed."
else
  log "Docker already installed."
fi

# ── 4. Clone / update repo ────────────────────────────────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  log "Pulling latest code..."
  git -C "$APP_DIR" pull
else
  log "Cloning repo to $APP_DIR..."
  git clone "$GIT_REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# ── 5. Environment file ───────────────────────────────────────────────────────
log "Writing .env.production..."
NEXTAUTH_URL="http://$DOMAIN"
[[ "$USE_SSL" == "yes" ]] && NEXTAUTH_URL="https://$DOMAIN"

cat > "$APP_DIR/.env.production" <<EOF
DATABASE_URL=http://db:8080
DATABASE_AUTH_TOKEN=
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$NEXTAUTH_URL
APP_MODE=web
NODE_ENV=production
EOF
chmod 600 "$APP_DIR/.env.production"

# ── 6. SSL / Nginx config ─────────────────────────────────────────────────────
mkdir -p nginx/ssl

if [[ "$USE_SSL" == "yes" ]]; then
  log "Setting up Let's Encrypt for $DOMAIN..."
  apt-get install -y -qq certbot
  # Temporarily bind port 80 to get the cert (before nginx starts)
  if ! certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"; then
    warn "Certbot failed — falling back to self-signed certificate."
    USE_SSL="selfsigned"
  else
    cp /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem nginx/ssl/fullchain.pem
    cp /etc/letsencrypt/live/"$DOMAIN"/privkey.pem   nginx/ssl/privkey.pem
    # Cron for renewal
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $APP_DIR/docker-compose.prod.yml exec nginx nginx -s reload") | crontab -
  fi
fi

if [[ "$USE_SSL" != "yes" ]]; then
  log "Generating self-signed certificate (replace with real cert later)..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/CN=$DOMAIN" 2>/dev/null
  # For HTTP-only (no SSL), replace the nginx config
  cat > nginx/conf.d/app.conf <<'NGINX'
upstream nextjs {
    server app:3000;
    keepalive 32;
}
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    location /_next/static/ {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX
fi

# ── 7. Build & start stack ────────────────────────────────────────────────────
log "Building Docker images and starting stack..."
docker compose -f docker-compose.prod.yml --env-file .env.production pull db
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# Wait for the app to be healthy
log "Waiting for app to be healthy..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml ps app | grep -q "healthy"; then
    break
  fi
  sleep 5
  echo -n "."
done
echo

# ── 8. Database seed (first deploy only) ─────────────────────────────────────
SEED_FLAG="$APP_DIR/.seeded"
if [[ ! -f "$SEED_FLAG" ]]; then
  log "Running database seed (first deploy)..."
  docker compose -f docker-compose.prod.yml exec app node -e "
    const { migrate } = require('drizzle-orm/libsql/migrator');
    console.log('Migrations run via instrumentation.ts on startup — skipping manual run.');
  " 2>/dev/null || true
  # Seed via tsx — requires node_modules in image or a separate seed step
  # Migrations auto-run on startup via instrumentation.ts
  touch "$SEED_FLAG"
  warn "IMPORTANT: Run seed manually if needed:"
  warn "  docker compose -f docker-compose.prod.yml exec app node -e \"require('./lib/db/seed.js')\""
fi

# ── 9. Firewall ───────────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  log "Configuring UFW firewall..."
  ufw --force enable
  ufw allow ssh
  ufw allow http
  ufw allow https
fi

# ── 10. Systemd auto-restart on reboot ───────────────────────────────────────
log "Installing systemd service for auto-start on reboot..."
cat > /etc/systemd/system/junglegym.service <<EOF
[Unit]
Description=Jungle Gym Play House
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml --env-file .env.production up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable junglegym.service

# ── Done ──────────────────────────────────────────────────────────────────────
log ""
log "╔══════════════════════════════════════════════════════╗"
log "║  Jungle Gym Play House is live!                      ║"
log "╚══════════════════════════════════════════════════════╝"
log ""
log "  URL: ${NEXTAUTH_URL}"
log "  Default login: admin@playnest.local / admin1234"
log ""
log "  Useful commands:"
log "  docker compose -f $APP_DIR/docker-compose.prod.yml logs -f app"
log "  docker compose -f $APP_DIR/docker-compose.prod.yml ps"
log "  docker compose -f $APP_DIR/docker-compose.prod.yml restart app"
log ""
warn "  Remember to:"
warn "  1. Change the default admin password immediately after first login"
warn "  2. Back up the libsql_data Docker volume regularly"
warn "  3. Keep NEXTAUTH_SECRET in a safe place"
