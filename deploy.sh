#!/bin/bash

# Deploy script for production
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Build application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Restart application (adjust based on your setup)
# For PM2:
# pm2 restart backend

# For Docker:
# docker-compose up -d --build

# For systemd:
# sudo systemctl restart backend

echo "✅ Deployment completed!"

