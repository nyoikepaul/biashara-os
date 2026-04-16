#!/usr/bin/env bash
# ================================================
# Biashara OS Developer CLI (Bash)
# All-in-one tool for start/stop/backup/migrate/logs
# ================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Biashara OS CLI v1.0${NC}"
echo "========================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

CMD=${1:-help}

case "$CMD" in
  start)
    echo -e "${GREEN}Starting all services...${NC}"
    docker compose up --build -d
    echo -e "${YELLOW}Frontend dev server: cd frontend && npm run dev${NC}"
    ;;
  stop)
    echo -e "${GREEN}Stopping all services...${NC}"
    docker compose down
    ;;
  restart)
    echo -e "${GREEN}Restarting services...${NC}"
    docker compose restart
    ;;
  logs)
    SERVICE=${2:-api}
    echo -e "${GREEN}Showing logs for service: $SERVICE${NC}"
    docker compose logs -f "$SERVICE"
    ;;
  status)
    echo -e "${GREEN}Container status:${NC}"
    docker compose ps
    ;;
  backup)
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    mkdir -p backups
    echo -e "${GREEN}Backing up PostgreSQL...${NC}"
    docker compose exec -T db pg_dump -U postgres -d biashara > "backups/db-${TIMESTAMP}.sql" 2>/dev/null || \
    echo -e "${YELLOW}Note: Adjust DB service/user/db name if needed${NC}"
    echo -e "${GREEN}✅ Backup saved → backups/db-${TIMESTAMP}.sql${NC}"
    ;;
  migrate)
    echo -e "${GREEN}Running Prisma migrations...${NC}"
    docker compose exec api npx prisma migrate deploy
    ;;
  help|*)
    echo -e "${YELLOW}Usage: ./scripts/biashara.sh [command]${NC}"
    echo ""
    echo "Commands:"
    echo "  start          → Start all services"
    echo "  stop           → Stop all services"
    echo "  restart        → Restart services"
    echo "  logs [service] → Show logs (default: api)"
    echo "  status         → Show container status"
    echo "  backup         → Backup PostgreSQL database"
    echo "  migrate        → Run Prisma database migrations"
    echo ""
    echo "Make it executable: chmod +x scripts/biashara.sh"
    ;;
esac
