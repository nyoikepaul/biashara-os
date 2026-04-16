#!/usr/bin/env bash
# Biashara OS M-Pesa Test Helper

set -euo pipefail
echo -e "\033[0;32m📱 M-Pesa Test Helper\033[0m"
echo "==================================="

if [ -z "$MPESA_CONSUMER_KEY" ]; then
  echo "⚠️  Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your .env"
  exit 1
fi

echo "Testing M-Pesa sandbox connection..."
curl -s -X GET "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n "$MPESA_CONSUMER_KEY:$MPESA_CONSUMER_SECRET" | base64)" | jq .

echo -e "\n✅ Run with: ./scripts/mpesa-test.sh"
