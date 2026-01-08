# Gateway Service

The Gateway is the API entry point for the TempMail Pro application. It exposes REST endpoints and proxies requests to backend microservices via HTTP.

## Architecture

```
                        ┌─────────────────┐
                        │    Frontend     │
                        │   (Next.js)     │
                        └────────┬────────┘
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                           GATEWAY                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Auth Module  │  │Health Module │  │ Payment Mod  │  ...         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │ HTTP            │ HTTP            │ HTTP                 │
└─────────┼─────────────────┼─────────────────┼──────────────────────┘
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │Auth Service │   │    Health   │   │Payment Svc  │
   │  (HTTP)     │   │   Endpoints │   │   (HTTP)    │
   └─────────────┘   └─────────────┘   └─────────────┘
```

## Features

- **REST API** - JSON API for frontend consumption
- **HTTP Proxy** - Forwards requests to microservices via HTTP
- **JWT Authentication** - Validates tokens via Auth Service
- **Rate Limiting** - Protects against abuse
- **CORS** - Configurable cross-origin settings
- **Validation** - Request body validation with DTOs
- **Monitoring** - New Relic APM integration
- **Global Exception Filter** - Consistent error response format

## Tech Stack

- **Framework**: NestJS
- **Protocol**: HTTP/REST (external and internal)
- **Validation**: class-validator, class-transformer
- **Monitoring**: New Relic APM

## Project Structure

```
src/
├── common/
│   ├── constants/          # Error messages, log messages, API config
│   ├── decorators/         # @Public, @CurrentUser decorators
│   ├── enums/              # HttpMethod enum
│   ├── filters/            # GlobalExceptionFilter
│   ├── guards/             # JwtAuthGuard
│   └── interfaces/         # Shared TypeScript interfaces
├── config/                 # Configuration modules
│   ├── app.config.ts       # App & service URLs
│   ├── endpoints.config.ts # Service endpoint paths
│   └── throttle.config.ts  # Rate limiting config
├── modules/
│   ├── auth/               # Auth endpoints
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts     # HTTP client calls
│   │   └── dto/                # Request validation DTOs
│   ├── payment/            # Payment endpoints
│   └── health/             # Health check endpoints
├── app.module.ts
└── main.ts
```

## API Endpoints

### Authentication

| Method | Endpoint                              | Description                 | Auth |
| ------ | ------------------------------------- | --------------------------- | ---- |
| POST   | `/api/v1/auth/register`               | Create new account          | No   |
| POST   | `/api/v1/auth/verify-email`           | Verify email with code      | No   |
| POST   | `/api/v1/auth/resend-verification`    | Resend verification code    | No   |
| POST   | `/api/v1/auth/login`                  | Login with email/password   | No   |
| POST   | `/api/v1/auth/logout`                 | Logout (revoke token)       | Yes  |
| POST   | `/api/v1/auth/refresh`                | Refresh access token        | No   |
| POST   | `/api/v1/auth/oauth/:provider`        | OAuth login (google/github) | No   |
| POST   | `/api/v1/auth/password-reset/request` | Request password reset      | No   |
| POST   | `/api/v1/auth/password-reset/confirm` | Set new password            | No   |
| GET    | `/api/v1/auth/me`                     | Get current user profile    | Yes  |
| PUT    | `/api/v1/auth/me`                     | Update user profile         | Yes  |

### Payments

| Method | Endpoint                        | Description                   | Auth |
| ------ | ------------------------------- | ----------------------------- | ---- |
| GET    | `/api/v1/payments/plans`        | Get all subscription plans    | No   |
| POST   | `/api/v1/payments/orders`       | Create Razorpay order         | Yes  |
| POST   | `/api/v1/payments/verify`       | Verify payment after checkout | Yes  |
| GET    | `/api/v1/payments/subscription` | Get current subscription      | Yes  |

### Health

| Method | Endpoint               | Description        | Auth |
| ------ | ---------------------- | ------------------ | ---- |
| GET    | `/api/v1/health`       | Basic health check | No   |
| GET    | `/api/v1/health/ready` | Readiness check    | No   |
| GET    | `/api/v1/health/live`  | Liveness check     | No   |

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error message"
}
```

## Authentication Flow

### How JWT Auth Works

1. Client sends request with `Authorization: Bearer <token>` header
2. `JwtAuthGuard` intercepts the request
3. Guard calls Auth Service `POST /validate-token` via HTTP
4. If valid, user info is attached to request (`@CurrentUser()`)
5. If invalid, returns 401 Unauthorized

### Public Routes

Routes decorated with `@Public()` bypass authentication:

```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

## Setup

### Prerequisites

- Node.js 18+
- Auth Service running on HTTP port 5001
- Payment Service running on HTTP port 5002
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start:dev
```

### Environment Variables

Create a `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# HTTP Services
AUTH_SERVICE_URL=http://localhost:5001
PAYMENT_SERVICE_URL=http://localhost:5002

# Internal API Key (for service-to-service auth)
INTERNAL_API_KEY=your-internal-api-key

# CORS (frontend URL)
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Monitoring (optional)
NEW_RELIC_LICENSE_KEY=
NEW_RELIC_APP_NAME=TempMail-Gateway
```

## Service Communication

The Gateway communicates with backend services via HTTP with internal API key authentication:

```typescript
// Example: Calling Auth Service
const response = await fetch(`${authServiceUrl}/validate-token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-api-key': internalApiKey,
  },
  body: JSON.stringify({ access_token: token }),
});
```

## Scripts

```bash
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm lint         # ESLint
pnpm test         # Run tests
```

## Monitoring

New Relic is integrated for APM. Set environment variables:

```env
NEW_RELIC_LICENSE_KEY=your-key
NEW_RELIC_APP_NAME=TempMail-Gateway
```

Sensitive headers are excluded from monitoring:

- `request.headers.cookie`
- `request.headers.authorization`
