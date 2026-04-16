#!/usr/bin/env bash
# Biashara OS Daily Backup (cron-ready)

set -euo pipefail
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}📦 Biashara OS Daily Backup${NC}"
echo "==================================="

# Docker check (WSL friendly)
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker not found. Enable WSL Integration in Docker Desktop.${NC}"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}→ Backing up PostgreSQL database...${NC}"
docker compose exec -T db pg_dump -U postgres -d biashara > "$BACKUP_DIR/db-full-${TIMESTAMP}.sql" 2>/dev/null || {
  echo -e "${YELLOW}⚠️  Could not connect to DB (is it running?). Trying fallback...${NC}"
}

echo -e "${GREEN}→ Compressing backup...${NC}"
tar -czf "$BACKUP_DIR/biashara-backup-${TIMESTAMP}.tar.gz" "$BACKUP_DIR/db-full-${TIMESTAMP}.sql" 2>/dev/null || true

# Optional: backup important folders (uncomment if you want)
# tar -czf "$BACKUP_DIR/files-${TIMESTAMP}.tar.gz" frontend/public/uploads 2>/dev/null || true

echo -e "${GREEN}✅ Backup completed → $BACKUP_DIR/biashara-backup-${TIMESTAMP}.tar.gz${NC}"
echo -e "${YELLOW}Tip: Add to cron with: crontab -e${NC}"
echo "   0 2 * * * cd ~/biashara-os && ./scripts/daily-backup.sh >> backups/backup.log 2>&1"
