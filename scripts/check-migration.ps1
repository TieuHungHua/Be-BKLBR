# PowerShell script to check if database is in sync and skip migration if already synced

Write-Host "🔍 Checking database migration status..." -ForegroundColor Cyan

# Check migration status
$migrationStatus = npx prisma migrate status 2>&1 | Out-String

# Check if database is already in sync
if ($migrationStatus -match "Database schema is up to date") {
    Write-Host "✅ Database schema is already up to date. Skipping migration." -ForegroundColor Green
    exit 0
}

# Check if there are pending migrations
if ($migrationStatus -match "migrations found") {
    Write-Host "📦 Pending migrations found. Running migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    exit $LASTEXITCODE
}

# If no migrations or status unclear, try to deploy
Write-Host "🔄 Running migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
exit $LASTEXITCODE

