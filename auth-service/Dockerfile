FROM node:22-alpine

WORKDIR /app

# Copy the shared proto directory
COPY proto /app/proto

# Copy the service directory
COPY auth-service /app/auth-service

WORKDIR /app/auth-service

# Install dependencies and build
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm build
RUN npx prisma generate

# Expose the port (Auth Service uses GRPC usually on a specific port, checks .env)
# But for Docker we might defaults.

CMD ["pnpm", "start:prod"]
