# Deployment Scripts Reference

Quick reference for the deployment automation scripts.

## Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy.sh` | **Deploy anywhere** with interactive setup | `./deploy.sh` |
| `ssl-setup.sh` | Generate free HTTPS certificates | `./ssl-setup.sh domain.com` |
| `backup.sh` | Create timestamped database backups | `./backup.sh` |
| `restore.sh` | Restore from backup | `./restore.sh backups/...` |

---

## 🚀 deploy.sh - Universal Deployment

**What it does:**
- Interactive deployment wizard
- Detects target (IP, domain, or domain:port)
- Creates `.env.prod` with your config
- Pulls latest Docker image
- Deploys using docker-compose
- Waits for health checks
- Shows access instructions

**Usage:**

```bash
# Interactive mode (recommended)
./deploy.sh

# Answers to prompts:
# 1) Choose: 1=IP, 2=Domain, 3=Domain+Port
# 2) Enter your deployment target
# 3) Use SSL? (for domains only)
# 4) Optional: customize container name, port, timezone, DNS server
# 5) Confirm deployment

# After deploy:
# ✅ Access at your domain/IP
# ✅ All config in .env.prod
# ✅ Database persisted in dns-data/
```

**What gets created:**

```
.env.prod                          # Your deployment config
dns-data/                          # Database volume
nginx-cache/                       # Nginx cache
backups/                           # Backup directory
```

**Customization after deployment:**

```bash
# Edit configuration
nano .env.prod

# Restart with changes
docker-compose -f docker-compose.prod.yml restart
```

---

## 🔐 ssl-setup.sh - HTTPS/SSL Certificates

**What it does:**
- Generates free SSL certificates from Let's Encrypt
- Copies certificates to `ssl/` directory
- Sets up automatic renewal
- Updates nginx config hints

**Prerequisites:**
- Domain must be publicly accessible
- Port 80 must be open
- certbot installed (auto-checks)

**Usage:**

```bash
# Interactive mode
./ssl-setup.sh

# Or non-interactive with domain argument
./ssl-setup.sh yourdomain.com

# Answer: your email for Let's Encrypt notices

# After completion:
# ✅ Certificates in ssl/cert.pem and ssl/key.pem
# ✅ Auto-renewal configured
# ✅ Ready to enable in docker-compose.prod.yml
```

**After SSL setup:**

```bash
# Update .env.prod
VITE_API_URL=https://yourdomain.com/api
CORS_ORIGIN=https://yourdomain.com

# Uncomment SSL section in docker-compose.prod.yml
# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx

# Test
curl https://yourdomain.com/api/health
```

**Automatic renewal:**

The script creates a renewal hook. To enable auto-renewal:

```bash
sudo crontab -e

# Add this line:
0 3 * * * cd /path/to/dns-monitoring && ./renew-certs.sh yourdomain.com
```

---

## 💾 backup.sh - Database Backups

**What it does:**
- Creates timestamped backup of database
- Supports Docker containers or local volumes
- Auto-cleanup of old backups (keeps last 10)
- Creates safety backup before restore

**Usage:**

```bash
# Default: backup to ./backups/
./backup.sh

# Custom location
./backup.sh /mnt/backup

# Output:
# ✅ Backup created: backups/dns-monitor-backup-20260321-150000
# Size shown
# Old backups auto-cleaned
```

**Backup structure:**

```
backups/
├── dns-monitor-backup-20260321-150000/     # Timestamped backup
│   ├── dns_monitor.db                      # SQLite database
│   ├── *.db-wal                            # Write-ahead log (if exists)
│   └── *.db-shm                            # Shared memory (if exists)
├── dns-monitor-backup-20260320-150000/
└── ...
```

**Automated backups (cron):**

```bash
# Edit crontab
crontab -e

# Add (runs daily at 2 AM):
0 2 * * * cd /path/to/dns-monitoring && ./backup.sh >> backups/backup.log 2>&1

# Check cron logs
tail -f backups/backup.log
```

**Backup retention:**

Script automatically keeps last 10 backups, deletes older ones.

---

## 🔄 restore.sh - Database Restore

**What it does:**
- Lists available backups
- Creates safety backup of current data
- Stops containers (if running)
- Restores database from backup
- Restarts containers
- Verifies restoration

**Usage:**

```bash
# List backups
ls -l backups/

# Restore (interactive confirmation)
./restore.sh backups/dns-monitor-backup-20260321-150000

# Will prompt:
# ✅ Shows backup details
# ✅ Creates safety backup as pre-restore-TIMESTAMP
# ✅ Confirms restore (type 'yes')
# ✅ Stops containers
# ✅ Restores data
# ✅ Restarts containers
# ✅ Verifies health
```

**Before restore:**

Your current data is automatically backed up to `backups/pre-restore-TIMESTAMP/`

**What's restored:**

- All monitors
- All DNS query results/history
- All alerts
- All settings

---

## Script Interaction Flow

```
┌─────────────────────────────────────────────┐
│   User runs: ./deploy.sh                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
    ┌─ Check Docker/Compose
    │
    ├─ Collect configuration
    │  └─ Target: IP/Domain
    │  └─ Port, TZ, DNS server, etc.
    │
    ├─ Create .env.prod
    │
    ├─ Backup existing data (if any)
    │
    ├─ Pull latest image from GHCR
    │
    ├─ Deploy with docker-compose
    │
    ├─ Wait for health checks
    │
    └─ Show access instructions
               │
               ▼
    ┌─────────────────────────────────┐
    │  ✅ Deployment Complete          │
    │  Access: http://your-domain      │
    │  Config: .env.prod               │
    │  Database: dns-data/             │
    └─────────────────────────────────┘
```

---

## Environment Variables Set by Scripts

### deploy.sh creates .env.prod with:

```bash
NODE_ENV=production
PORT=3000
VITE_API_URL=<your-url>
CORS_ORIGIN=<your-domain>
DEFAULT_DNS_SERVER=1.1.1.1
QUERY_TIMEOUT_MS=5000
LOG_LEVEL=info
QUERY_RETENTION_DAYS=30
TZ=<your-timezone>
CONTAINER_PREFIX=dns-monitoring
EXTERNAL_PORT=80
DEPLOYED_AT=<timestamp>
DEPLOYED_TO=<your-domain>
```

### All are customizable:

Edit `.env.prod` and restart:

```bash
docker-compose -f docker-compose.prod.yml restart
```

---

## Troubleshooting Scripts

### deploy.sh says Docker not found

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### ssl-setup.sh says certbot not found

```bash
# macOS
brew install certbot

# Ubuntu/Debian
sudo apt-get install certbot

# CentOS
sudo yum install certbot

# Or Docker-based
docker run -it certbot/certbot certonly --standalone -d yourdomain.com
```

### backup.sh says no containers

```bash
# Ensure containers are running
docker-compose -f docker-compose.prod.yml up -d

# Or backup locally
./backup.sh

# It auto-detects and uses local dns-data/ directory
```

### restore.sh says confirmation failed

```bash
# Must type 'yes' (not y or yes)
./restore.sh backups/dns-monitor-backup-...

# When prompted, type: yes
```

---

## Advanced Usage

### Deploy without interaction

```bash
# Set environment variables
export DEPLOY_HOST="192.168.1.100"
export DEPLOY_DOMAIN="http://192.168.1.100"
export API_URL="http://192.168.1.100/api"
export CONTAINER_PREFIX="dns-mon"
export EXTERNAL_PORT="8080"
export TIMEZONE="America/New_York"

# Run deploy (will use env vars)
./deploy.sh < /dev/null
```

### Backup to network location

```bash
# Backup to NFS/SMB mount
./backup.sh /mnt/nas/dns-backups

# Or use rsync
./backup.sh /tmp
rsync -az /tmp/dns-monitor-backup-* nas:/backups/
```

### Restore specific backup

```bash
# List with timestamps
ls -lh backups/dns-monitor-backup-*

# Restore specific one
./restore.sh backups/dns-monitor-backup-20260315-000000

# Confirm with 'yes'
```

---

## Script Permissions

All scripts need execute permission:

```bash
chmod +x deploy.sh backup.sh restore.sh ssl-setup.sh
```

If you get permission denied:

```bash
# Fix for all scripts
chmod +x *.sh
```

---

## Logs and Debugging

### View deployment logs

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last N lines
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### View backup logs (if using cron)

```bash
tail -f backups/backup.log
```

### View script output (redirect to file)

```bash
./deploy.sh | tee deploy.log
./backup.sh | tee backup.log
```

---

## Quick Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Script not executable | `chmod +x *.sh` |
| Docker not found | `curl -fsSL https://get.docker.com \| sh` |
| Permission denied | `sudo chmod +x *.sh` |
| Containers won't start | `docker-compose -f docker-compose.prod.yml logs` |
| Backup failed | Containers must be running or `dns-data/` must exist |
| SSL setup fails | Port 80 must be open, domain must be accessible |
| Can't restore | Use `./restore.sh backups/dns-monitor-backup-...` |

---

## Best Practices

✅ **Before deploying:**
- Know your IP address or domain
- Have port 80 available (or change in deploy.sh)
- If using HTTPS, have port 443 available

✅ **After deploying:**
- Test access from another device
- Create a backup: `./backup.sh`
- Check logs for errors: `docker-compose logs`

✅ **Regular maintenance:**
- Setup automated backups (cron job)
- Monitor disk space: `du -sh dns-data/`
- Check logs weekly for errors
- Update image monthly: `docker pull ghcr.io/freemen810/dns-monitoring:latest`

✅ **Backup strategy:**
- Create backup before major changes
- Store backups on separate drive/NAS
- Test restore periodically
- Keep at least 3 recent backups

---

**Last Updated:** 2026-03-21
