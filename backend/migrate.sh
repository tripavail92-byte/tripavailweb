#!/bin/bash
# Render One-Off Migration Script
# This runs the database migration on the Render service

set -e

echo "🔄 Starting Prisma migrations..."
echo "Time: $(date)"
echo ""

# Navigate to app directory
cd /app/backend || cd /app

# Run migrations
echo "⏳ Running: pnpm prisma migrate deploy"
pnpm prisma migrate deploy

echo ""
echo "✅ Migrations completed!"
echo "Time: $(date)"
