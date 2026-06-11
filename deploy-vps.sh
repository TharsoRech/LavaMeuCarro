#!/bin/bash
# Manual deployment script for LavaMeuCarro VPS
# Usage: ./deploy-vps.sh

set -e

VPS_HOST="${VPS_HOST:-187.127.26.164}"
VPS_USER="${VPS_USER:-root}"
DEPLOY_DIR="/opt/lavameucarro"

echo "🚀 Starting deployment to VPS ($VPS_HOST)..."

# Test SSH connection first
echo "📡 Testing SSH connection..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo '✅ SSH connection successful'" || {
    echo "❌ Failed to connect to VPS via SSH"
    echo "Please check:"
    echo "1. VPS is running"
    echo "2. SSH key is configured"
    echo "3. Firewall allows SSH connections"
    exit 1
}

# Deploy
echo "📦 Deploying application..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
set -e
cd /opt/lavameucarro
echo "📥 Pulling latest changes..."
git pull origin main
echo "🔄 Restarting services..."
docker compose down
docker compose build --no-cache
docker compose up -d
echo "🧹 Cleaning up old images..."
docker system prune -f
echo "✅ Deployment completed successfully!"
ENDSSH

echo "🎉 Deployment finished!"
