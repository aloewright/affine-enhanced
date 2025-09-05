# Multi-stage build for AFFiNE with optimized production image
FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Production dependencies stage
FROM base AS deps
RUN yarn install --immutable --production=false

# Build stage
FROM deps AS builder
COPY . .

# Build the application
RUN yarn build

# Production image
FROM node:22-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 affine

# Copy built application
COPY --from=builder /app/packages/backend/server/dist ./server
COPY --from=builder /app/packages/frontend/core/dist ./frontend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create directories for persistent storage
RUN mkdir -p /app/storage /app/config && \
    chown -R affine:nodejs /app

USER affine

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/api/healthcheck', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/index.js"]
