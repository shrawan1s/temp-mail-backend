# Auth Service

The Auth Service is an HTTP microservice that handles all authentication and user management operations for the TempMail Pro application.

## Architecture

```
┌─────────────┐      HTTP        ┌──────────────┐
│   Gateway   │ ──────────────►  │ Auth Service │
└─────────────┘                  └──────┬───────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     │                  │                  │
                     ▼                  ▼                  ▼
              ┌──────────┐       ┌───────────┐      ┌───────────┐
              │PostgreSQL│       │   Redis   │      │   Brevo   │
              │(Prisma)  │       │ (Tokens)  │      │  (Email)  │
              └──────────┘       └───────────┘      └───────────┘
```

## Features

- **User Registration** - Email/password signup with verification
- **Email Verification** - 6-digit code with 10-minute expiry
- **Login/Logout** - JWT-based authentication
- **Token Management** - Access tokens (15m), refresh tokens (7d), token rotation
- **OAuth** - Google and GitHub social login
- **Password Reset** - Secure token-based password reset flow
- **User Profile** - Get and update user information

## Tech Stack

- **Framework**: NestJS with HTTP transport
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis for token blacklisting and sessions
- **Email**: Brevo (formerly Sendinblue) for transactional emails
- **Monitoring**: New Relic APM

## Project Structure

```
src/
├── auth/                 # Controller and service
│   ├── auth.controller.ts  # HTTP endpoints
│   ├── auth.service.ts     # Business logic
│   └── auth.module.ts
├── user/                 # User management
│   └── user.service.ts     # CRUD, verification, password
├── token/                # Token management
│   └── token.service.ts    # JWT, refresh tokens, password reset
├── email/                # Email service
│   ├── email.service.ts    # Brevo integration
│   └── templates/          # Email templates
├── oauth/                # OAuth providers
│   └── oauth.service.ts    # Google and GitHub OAuth flows
├── redis/                # Redis client
│   └── redis.service.ts    # Token blacklisting, sessions
├── prisma/               # Database client
│   └── prisma.service.ts
├── config/               # Configuration modules
├── constants/            # Response messages, CORS constants
├── guards/               # InternalApiKeyGuard
├── interfaces/           # TypeScript interfaces
└── main.ts               # Application bootstrap
```

## HTTP Endpoints

| Method | Endpoint                   | Description                          | Guard             |
| ------ | -------------------------- | ------------------------------------ | ----------------- |
| POST   | `/register`                | Create new user, send verification   | Internal API Key  |
| POST   | `/verify-email`            | Verify email with 6-digit code       | Internal API Key  |
| POST   | `/resend-verification`     | Resend verification email            | Internal API Key  |
| POST   | `/login`                   | Authenticate with email/password     | Internal API Key  |
| POST   | `/logout`                  | Blacklist access token               | Internal API Key  |
| POST   | `/refresh-token`           | Get new token pair                   | Internal API Key  |
| POST   | `/validate-token`          | Validate access token (for Gateway)  | Internal API Key  |
| POST   | `/get-user`                | Get user profile by ID               | Internal API Key  |
| PUT    | `/update-user`             | Update user name/avatar              | Internal API Key  |
| POST   | `/oauth-login`             | Authenticate via Google/GitHub       | Internal API Key  |
| POST   | `/request-password-reset`  | Send password reset email            | Internal API Key  |
| POST   | `/reset-password`          | Set new password with reset token    | Internal API Key  |

## Health Endpoints

| Endpoint        | Description                    | Response                           |
| --------------- | ------------------------------ | ---------------------------------- |
| GET `/health`       | Basic health check             | `{ status, service, timestamp }`   |
| GET `/health/ready` | Readiness check (DB connected) | `{ status, database, timestamp }`  |
| GET `/health/live`  | Liveness check                 | `{ status, timestamp }`            |

## Authentication Flow

### Email/Password Registration

```
1. Client → Gateway: POST /api/v1/auth/register {email, password, name}
2. Gateway → Auth Service: POST /register (with x-internal-api-key)
3. Auth Service: Create user, generate 6-digit code
4. Auth Service → Brevo: Send verification email
5. Auth Service → Gateway → Client: {success, user_id}
6. Client → Gateway: POST /api/v1/auth/verify-email {userId, code}
7. Gateway → Auth Service: POST /verify-email
8. Auth Service: Mark verified, generate tokens
9. Auth Service → Gateway → Client: {tokens, user}
```

### OAuth Flow

```
1. Client: Redirect to Google/GitHub OAuth URL
2. Provider: User authorizes, redirects with code
3. Client → Gateway: POST /api/v1/auth/oauth/google {code, redirectUri}
4. Gateway → Auth Service: POST /oauth-login
5. Auth Service → Google/GitHub: Exchange code for access token
6. Auth Service → Google/GitHub: Fetch user info
7. Auth Service: Find/create user, generate tokens
8. Auth Service → Gateway → Client: {tokens, user}
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
pnpm start:dev
```

### Environment Variables

Create a `.env` file:

```env
# Server
PORT=5001
NODE_ENV=development

# Internal API Key (for service-to-service auth)
INTERNAL_API_KEY=your-internal-api-key

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/temp_email_auth"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email (Brevo)
BREVO_API_KEY=
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=TempMail

# Frontend (for email links)
FRONTEND_URL=http://localhost:3000

# Monitoring (optional)
NEW_RELIC_LICENSE_KEY=
NEW_RELIC_APP_NAME=TempMail-Auth
```

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **Token Blacklisting**: Revoked tokens stored in Redis until expiry
- **Token Rotation**: Old refresh token deleted when new pair issued
- **Internal API Key**: Service-to-service authentication
- **Input Validation**: DTO validation with class-validator

## Scripts

```bash
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm lint         # ESLint
pnpm test         # Run tests
```
