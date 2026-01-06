FROM node:22-alpine

WORKDIR /app

# Install OpenSSL (required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy the shared database package (linked dependency)
COPY database /app/database

# Copy the shared proto directory
COPY proto /app/proto

# Copy the service directory
COPY auth-service /app/auth-service

# Build the database package first
WORKDIR /app/database
RUN npm install -g pnpm && pnpm install
RUN npx prisma generate

# Build the service
WORKDIR /app/auth-service
RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 5001

CMD ["pnpm", "start:prod"]
