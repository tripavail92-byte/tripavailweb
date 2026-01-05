# Next.js Frontend Development Image
FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace files FIRST
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy web and shared packages BEFORE install
COPY web ./web
COPY shared ./shared

# Install all dependencies in workspace (will install all packages including web)
RUN pnpm install --frozen-lockfile

WORKDIR /app/web

# Expose port
EXPOSE 4000

# Start the application in development mode
CMD ["pnpm", "dev"]
