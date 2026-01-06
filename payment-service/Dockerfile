FROM node:22-alpine

WORKDIR /app

# Install OpenSSL (required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy the shared database package (linked dependency)
COPY database /app/database

# Copy the service directory (includes proto files in src/proto/)
COPY payment-service /app/payment-service

# Build the database package first (generates Prisma client + compiles TS)
WORKDIR /app/database
RUN npm install -g pnpm && pnpm install
RUN npx prisma generate
RUN pnpm build

# Build the service
WORKDIR /app/payment-service
RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 5002

CMD ["pnpm", "start:prod"]
