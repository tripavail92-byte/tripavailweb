#!/bin/bash
# Run Prisma migrations on Render
# Usage: Call this from Render Shell or as a one-off job

set -e

echo "🔄 Running Prisma migrations..."
echo "Database URL: $DATABASE_URL"
echo ""

# Run migrations
pnpm prisma migrate deploy

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "Check your database:"
echo "  - Schema updated: \`prisma/schema.prisma\`"
echo "  - Migration logs: \`prisma/migrations/\`"
