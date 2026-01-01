# Gateway Service

The Gateway is the API entry point for the TempMail Pro application. It exposes REST endpoints and proxies requests to backend microservices via gRPC.

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
│  │ Auth Module  │  │ Mail Module  │  │ Payment Mod  │  ...         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │ gRPC            │ gRPC            │ gRPC                 │
└─────────┼─────────────────┼─────────────────┼──────────────────────┘
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │Auth Service │   │Mail Service │   │Payment Svc  │
   └─────────────┘   └─────────────┘   └─────────────┘
```

## Features

- **REST API** - JSON API for frontend consumption
- **gRPC Proxy** - Forwards requests to microservices
- **JWT Authentication** - Validates tokens via Auth Service
- **Rate Limiting** - Protects against abuse
- **CORS** - Configurable cross-origin settings
- **Validation** - Request body validation with DTOs
- **Monitoring** - New Relic APM integration

## Tech Stack

- **Framework**: NestJS
- **Protocol**: HTTP/REST (external), gRPC (internal)
- **Validation**: class-validator, class-transformer
- **Monitoring**: New Relic APM

## Project Structure

```
src/
├── common/
│   ├── decorators/         # @Public, @CurrentUser decorators
│   ├── guards/             # JwtAuthGuard
│   ├── interfaces/         # Shared TypeScript interfaces
│   └── filters/            # Exception filters
├── config/                 # Configuration modules
├── grpc/                   # gRPC interfaces and types
├── modules/
│   └── auth/               # Auth endpoints
│       ├── auth.controller.ts  # REST endpoints
│       ├── auth.service.ts     # gRPC client calls
│       ├── auth.module.ts
│       └── dto/                # Request validation DTOs
├── app.module.ts           # Root module
└── main.ts                 # Application bootstrap
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

## Request/Response Examples

### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

Response:

```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": "uuid-here"
}
```

### Verify Email

```bash
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "userId": "uuid-here",
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Email verified successfully",
  "access_token": "eyJhbGc...",
  "refresh_token": "uuid-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "",
    "plan": "free"
  }
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGc...",
  "refresh_token": "uuid-here",
  "user": { ... }
}
```

### OAuth Login

```bash
POST /api/v1/auth/oauth/google
Content-Type: application/json

{
  "provider": "google",
  "code": "auth-code-from-google",
  "redirectUri": "https://yourapp.com/auth/callback"
}
```

### Authenticated Request

```bash
GET /api/v1/auth/me
Authorization: Bearer eyJhbGc...
```

### Refresh Token

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "uuid-refresh-token"
}
```

## Authentication Flow

### How JWT Auth Works

1. Client sends request with `Authorization: Bearer <token>` header
2. `JwtAuthGuard` intercepts the request
3. Guard calls Auth Service `ValidateToken` via gRPC
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
- Auth Service running on gRPC port
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start:dev
```

### Environment Variables

Create a `.env` file (see `sample.env`):

```env
# Server
PORT=5000
NODE_ENV=development

# gRPC Services
AUTH_SERVICE_URL=localhost:50051
MAIL_SERVICE_URL=localhost:50052
MAILBOX_SERVICE_URL=localhost:50053
PAYMENT_SERVICE_URL=localhost:50054

# CORS (frontend URL)
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Monitoring (optional)
NEW_RELIC_LICENSE_KEY=
NEW_RELIC_APP_NAME=TempMail-Gateway
```

## gRPC Configuration

The Gateway connects to microservices via gRPC. Proto files are in `proto/`:

```protobuf
// proto/auth.proto
syntax = "proto3";
package auth;

service AuthService {
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc VerifyEmail(VerifyEmailRequest) returns (AuthResponse);
  rpc ResendVerificationCode(ResendVerificationRequest) returns (ResendVerificationResponse);
  rpc Login(LoginRequest) returns (AuthResponse);
  rpc Logout(LogoutRequest) returns (LogoutResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (AuthResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UserResponse);
  rpc OAuthLogin(OAuthLoginRequest) returns (AuthResponse);
  rpc RequestPasswordReset(PasswordResetRequest) returns (PasswordResetResponse);
  rpc ResetPassword(ResetPasswordConfirmRequest) returns (ResetPasswordConfirmResponse);
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

HTTP status codes:

- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation)
- `401` - Unauthorized
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Rate Limiting

Configured via environment variables:

- `THROTTLE_TTL`: Window in seconds (default: 60)
- `THROTTLE_LIMIT`: Max requests per window (default: 100)

## CORS

Configured via `CORS_ORIGIN` environment variable. Supports credentials for cookie-based auth if needed.

## Scripts

```bash
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm lint         # ESLint
pnpm test         # Run tests
```

## Adding New Services

1. Create proto file in `proto/`
2. Generate interfaces in `src/grpc/`
3. Create module in `src/modules/`
4. Register gRPC client in module
5. Implement controller with REST endpoints
6. Add module to `app.module.ts`

## Monitoring

New Relic is integrated for APM. Set environment variables:

```env
NEW_RELIC_LICENSE_KEY=your-key
NEW_RELIC_APP_NAME=TempMail-Gateway
```

Sensitive headers are excluded from monitoring:

- `request.headers.cookie`
- `request.headers.authorization`
