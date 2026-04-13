FROM node:20-alpine AS builder

WORKDIR /app

# Build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --only=production

# ------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Runtime deps only (better-sqlite3 needs libstdc++)
RUN apk add --no-cache libstdc++ wget

# Copy built node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package.json ./
COPY src ./src
COPY public ./public

# Create data & upload directories
RUN mkdir -p data public/uploads/cars public/uploads/brands public/uploads/hero

# Run migration + seed at build time (creates initial DB)
ENV NODE_ENV=production
RUN node src/db/migrate.js && node src/db/seed.js

EXPOSE 3000

ENV PORT=3000
ENV SESSION_SECRET=elkaif-cars-production-secret-change-me

# Use node directly (handles SIGTERM for graceful shutdown)
CMD ["node", "src/server.js"]
