FROM node:22-alpine

WORKDIR /app

# Copy the service directory
COPY gateway /app/gateway

WORKDIR /app/gateway

# Install dependencies and build
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 5000

CMD ["pnpm", "start:prod"]
