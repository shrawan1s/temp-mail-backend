FROM node:22-alpine

WORKDIR /app

# Install OpenSSL (required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy the shared proto directory
COPY proto /app/proto

# Copy the service directory
COPY payment-service /app/payment-service

WORKDIR /app/payment-service

# Install dependencies and build
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN npx prisma generate
RUN pnpm build

# Expose gRPC port (default 5002)
EXPOSE 5002

CMD ["pnpm", "start:prod"]
