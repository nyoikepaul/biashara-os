#!/bin/bash

# 1. Kill any existing processes
echo "Cleaning up ports..."
sudo fuser -k 3001/tcp > /dev/null 2>&1
pkill ngrok

# 2. Start Backend in background
echo "Starting Backend..."
cd ~/biashara-os/backend
npm run dev > backend.log 2>&1 &

# 3. Wait for boot
echo "Waiting for backend to warm up..."
sleep 5

# 4. Start Ngrok
echo "Launching Ngrok Tunnel..."
ngrok http 3001
