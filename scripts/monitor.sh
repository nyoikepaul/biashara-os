#!/usr/bin/env bash
# Biashara OS Health Monitor

set -euo pipefail
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GREEN}🔍 Biashara OS Health Check${NC}"
echo "==================================="

docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}Checking API health...${NC}"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "API not responding"

echo -e "\n${GREEN}✅ All services checked!${NC}"
