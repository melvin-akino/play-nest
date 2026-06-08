# Infrastructure

## Development
| Component | Tool |
|---|---|
| Runtime | Node.js 20 LTS |
| Package manager | pnpm |
| DB (local) | PostgreSQL 16 via Docker (mirrors Neon in prod) |
| Env management | `.env.local` (never committed) |

## Production (web mode)
| Component | Option |
|---|---|
| Hosting | AWS t3.micro (free tier) |
| DB | Neon (serverless PostgreSQL, free tier — offloaded from instance) |
| Process manager | PM2 |
| Reverse proxy | Nginx |

## Memory Configuration (t3.micro — 1GB RAM)

### Swap Setup (run once on first provision)
```bash
# Allocate 2GB swap file (2x RAM rule for low-memory instances)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Persist across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Kernel Tuning (`/etc/sysctl.conf`)
```
# Only use swap when RAM is ~90% full (default is 60 — too aggressive)
vm.swappiness=10

# Reduce inode/dentry cache aggressiveness
vm.vfs_cache_pressure=50
```

Apply without reboot:
```bash
sudo sysctl -p
```

### RAM Budget
```
Next.js standalone    ~150–180 MB
PM2                   ~30 MB
Nginx                 ~10 MB
OS baseline           ~200 MB
─────────────────────────────────
Active RAM            ~390–420 MB
Swap headroom         2 GB
```

> Swap is the safety net — not the operating baseline. If active RAM consistently exceeds 700MB, investigate a memory leak before scaling.

## Production (desktop mode)
- Tauri app bundled via `tauri build` → produces `.msi` / `.exe` installer for Windows
- Rust toolchain required at build time only (not at runtime)
- PostgreSQL runs locally on Windows PC
- App auto-starts on Windows login via Tauri `tauri.conf.json` startup config

## Environment Variables
```
DATABASE_URL=postgresql://<neon-connection-string>  # local: postgresql://user:pass@localhost:5432/playnest
NEXTAUTH_SECRET=<random>
NEXTAUTH_URL=http://localhost:3000
PRINTER_ENABLED=true|false
APP_MODE=web|desktop
```

## Observability
- Structured logging via `pino`
- Error boundaries on all API routes (never leak stack traces to client)
- Session audit trail: all status transitions logged with timestamp + staff ID

## Backup
- Daily pg_dump to local file (desktop) or automated snapshot (VPS)
