#!/usr/bin/env bash
# Biashara OS Health Monitor v2

set -euo pipefail
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker command not found in WSL.${NC}"
  echo -e "${YELLOW}→ Open Docker Desktop → Settings → Resources → WSL Integration → enable your distro${NC}"
  exit 1
fi

echo -e "${GREEN}🔍 Biashara OS Health Check${NC}"
echo "==================================="

docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}Checking API health...${NC}"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "API not responding (is it running?)"

echo -e "\n${GREEN}✅ Health check complete!${NC}"
