FROM node:20-alpine AS builder

# Install pnpm and openssl (needed for Prisma)
RUN npm install -g pnpm
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN pnpm prisma generate

# Copy source code and config files
COPY . .

# Build the application
RUN pnpm build

# Prune development dependencies
RUN pnpm prune --prod

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install openssl (needed for Prisma client at runtime)
RUN apk add --no-cache openssl

# Set environment to production
ENV NODE_ENV=production

# Copy built assets from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy New Relic configuration
COPY --from=builder /usr/src/app/newrelic.js ./
COPY --from=builder /usr/src/app/newrelic-loader.js ./

# Expose the port
EXPOSE 5000

# Start command (matching package.json start:prod)
CMD ["node", "-r", "./newrelic-loader.js", "dist/main"]
