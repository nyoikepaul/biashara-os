#!/usr/bin/env bash
# Biashara OS Cleanup Helper

set -euo pipefail
echo -e "\033[0;32m🧹 Biashara OS Cleanup\033[0m"
echo "==================================="

docker compose down
docker system prune -f
rm -rf frontend/.next .next
echo "✅ Cleanup complete!"
