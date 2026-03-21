# DNS Monitoring - Deployment Quick Start

**One command to deploy anywhere.** ⚡

```bash
./deploy.sh
```

That's it. Answer the prompts and you're done.

---

## 30-Second Overview

1. **Clone & setup**
   ```bash
   git clone <your-repo>
   cd dns-monitoring
   ```

2. **Run deployment**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Answer 2 questions:**
   - Where? (IP or domain)
   - API URL?

4. **Access**
   ```
   http://your-ip-or-domain
   ```

---

## What Happens Automatically

✅ Checks Docker & Docker Compose installed
✅ Prompts for configuration (domain/IP)
✅ Creates `.env.prod` with your settings
✅ Pulls latest image from GHCR
✅ Deploys with docker-compose
✅ Waits for health checks
✅ Shows access URL

**Total time:** 2-5 minutes (depending on image download)

---

## Popular Deployment Targets

### Unraid
```bash
./deploy.sh
# Choose: 1) IP address
# Enter: your-unraid-ip (e.g., 192.168.1.50)
# Access: http://192.168.1.50
```

### DigitalOcean / Linode / Hetzner
```bash
./deploy.sh
# Choose: 2) Domain name
# Enter: yourdomain.com
# Enable HTTPS? Yes
#
# Then run: ./ssl-setup.sh yourdomain.com
# Access: https://yourdomain.com
```

### Home Server
```bash
./deploy.sh
# Choose: 1) IP address
# Enter: 192.168.1.100
# Access: http://192.168.1.100
```

### Raspberry Pi
```bash
# Same as above, may take longer
./deploy.sh
# Be patient (RPi 3B+ recommended)
```

---

## Essential Commands (Post-Deploy)

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Backup
./backup.sh

# Restore from backup
./restore.sh backups/dns-monitor-backup-YYYYMMDD-HHMMSS

# Update to latest version
docker pull ghcr.io/freemen810/dns-monitoring:latest
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl http://your-domain/api/health
```

---

## Customization

Edit `.env.prod` after deployment:

```bash
# Change timezone
TZ=America/New_York

# Change DNS retention
QUERY_RETENTION_DAYS=90

# Change default DNS server
DEFAULT_DNS_SERVER=8.8.8.8

# Then restart
docker-compose -f docker-compose.prod.yml restart
```

---

## Backup & Restore

```bash
# Backup (automatic cleanup of old backups)
./backup.sh

# Restore
./restore.sh backups/dns-monitor-backup-20260321-150000

# Automated backups (cron)
crontab -e
# Add: 0 2 * * * cd /path/to/dns-monitoring && ./backup.sh
```

---

## SSL/HTTPS Setup

```bash
# Generate free certificate
./ssl-setup.sh yourdomain.com

# Updates configuration automatically
# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx

# Access via HTTPS
https://yourdomain.com
```

---

## Troubleshooting

**Can't run deploy.sh?**
```bash
chmod +x deploy.sh
```

**Docker not found?**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
```

**Containers not starting?**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Need to restore from backup?**
```bash
./restore.sh backups/dns-monitor-backup-...
# Type 'yes' to confirm
```

---

## Next Steps

1. ✅ Deploy with `./deploy.sh`
2. ✅ Access at your domain/IP
3. ✅ Create your first monitor (Settings → Create Monitor)
4. ✅ Setup HTTPS with `./ssl-setup.sh`
5. ✅ Enable automated backups with cron

---

## Files Created By Deploy

```
.env.prod                  # Your configuration
dns-data/                  # Database (persistent)
nginx-cache/               # Nginx cache
backups/                   # Backup directory
```

---

## Need Help?

- **Check logs:** `docker-compose -f docker-compose.prod.yml logs`
- **Full guide:** See `DEPLOYMENT.md`
- **Script details:** See `SCRIPTS.md`
- **Code guide:** See `CLAUDE.md`

---

**🚀 Ready? Run:** `./deploy.sh`
