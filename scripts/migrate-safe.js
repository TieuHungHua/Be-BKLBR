#!/usr/bin/env node

/**
 * Safe migration script that checks if database is already synced
 * before running migrations to avoid errors
 */

const { execSync } = require('child_process');

console.log('🔍 Checking database migration status...');

try {
  // Check migration status
  const statusOutput = execSync('npx prisma migrate status', {
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  // Check if database is already in sync
  if (statusOutput.includes('Database schema is up to date')) {
    console.log('✅ Database schema is already up to date. Skipping migration.');
    process.exit(0);
  }

  // If not synced, run migrations
  console.log('📦 Pending migrations found. Running migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations completed successfully.');
  process.exit(0);
} catch (error) {
  // If migrate status fails, try to deploy anyway
  if (error.message.includes('Database schema is up to date')) {
    console.log('✅ Database schema is already up to date. Skipping migration.');
    process.exit(0);
  }

  console.log('🔄 Running migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully.');
    process.exit(0);
  } catch (deployError) {
    console.error('❌ Migration failed:', deployError.message);
    process.exit(1);
  }
}

