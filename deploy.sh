#!/bin/bash

# Deploy script for production
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Build application
echo "📦 Building application..."
npm run build

# Run database migrations (with check to skip if already synced)
echo "🗄️  Checking and running database migrations..."
if [ -f "scripts/check-migration.sh" ]; then
  bash scripts/check-migration.sh
else
  # Fallback: check status first
  MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
  if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is already up to date. Skipping migration."
  else
    echo "📦 Running migrations..."
    npx prisma migrate deploy
  fi
fi

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










