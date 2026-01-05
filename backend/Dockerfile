FROM node:20-bullseye-slim

WORKDIR /app

# Install pnpm and libssl1.1 (available in Debian Bullseye)
RUN apt-get update && apt-get install -y --no-install-recommends libssl1.1 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.26.2

# Copy entire workspace
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client and build
WORKDIR /app/backend
RUN pnpm exec prisma generate && pnpm build

EXPOSE 4100

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:4100/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

WORKDIR /app

CMD ["node", "backend/dist/src/main.js"]

