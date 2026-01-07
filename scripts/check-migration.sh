#!/bin/bash

# Script to check if database is in sync and skip migration if already synced

echo "🔍 Checking database migration status..."

# Check migration status
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)

# Check if database is already in sync
if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
  echo "✅ Database schema is already up to date. Skipping migration."
  exit 0
fi

# Check if there are pending migrations
if echo "$MIGRATION_STATUS" | grep -q "migrations found"; then
  echo "📦 Pending migrations found. Running migrations..."
  npx prisma migrate deploy
  exit $?
fi

# If no migrations or status unclear, try to deploy
echo "🔄 Running migrations..."
npx prisma migrate deploy
exit $?

