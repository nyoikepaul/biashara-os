#!/usr/bin/env bash
# Biashara OS M-Pesa Test Helper v2

set -euo pipefail
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}📱 M-Pesa Test Helper v2${NC}"
echo "==================================="

# Graceful check even if vars are not set
if [ -z "${MPESA_CONSUMER_KEY:-}" ] || [ -z "${MPESA_CONSUMER_SECRET:-}" ]; then
  echo -e "${YELLOW}⚠️  MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET not set.${NC}"
  echo "→ Add them to your .env file (or export them) and run again."
  exit 1
fi

echo -e "${GREEN}Testing M-Pesa sandbox OAuth...${NC}"
curl -s -X GET "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n "${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}" | base64)" | jq . || echo "→ Install jq with: sudo apt install jq"

echo -e "\n${GREEN}✅ M-Pesa test complete!${NC}"
