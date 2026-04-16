#!/usr/bin/env bash
# Biashara OS Cleanup Helper v2

set -euo pipefail
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker command not found in WSL.${NC}"
  echo -e "${YELLOW}→ Enable WSL Integration in Docker Desktop Settings${NC}"
  exit 1
fi

echo -e "${GREEN}🧹 Biashara OS Cleanup${NC}"
echo "==================================="

docker compose down
docker system prune -f
rm -rf frontend/.next .next node_modules/.cache 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup complete!${NC}"
