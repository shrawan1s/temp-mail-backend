# Auth Service

The Auth Service is a gRPC microservice that handles all authentication and user management operations for the TempMail Pro application.

## Architecture

```
┌─────────────┐      gRPC       ┌──────────────┐
│   Gateway   │ ──────────────► │ Auth Service │
└─────────────┘                 └──────┬───────┘
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

- **Framework**: NestJS with gRPC transport
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis for token blacklisting and sessions
- **Email**: Brevo (formerly Sendinblue) for transactional emails
- **Monitoring**: New Relic APM

## Project Structure

```
src/
├── auth/                 # gRPC controller and module
│   ├── auth.controller.ts  # gRPC methods (Register, Login, etc.)
│   └── auth.module.ts
├── user/                 # User management
│   └── user.service.ts     # CRUD, verification, password
├── token/                # Token management
│   └── token.service.ts    # JWT, refresh tokens, password reset
├── email/                # Email service
│   └── email.service.ts    # Verification codes, password reset emails
├── oauth/                # OAuth providers
│   └── oauth.service.ts    # Google and GitHub OAuth flows
├── redis/                # Redis client
│   └── redis.service.ts    # Token blacklisting, sessions
├── prisma/               # Database client
│   └── prisma.service.ts
├── config/               # Configuration modules
├── constants/            # Response messages
├── interfaces/           # TypeScript interfaces
└── main.ts               # Application bootstrap
```

## gRPC Methods

| Method                   | Description                              | Auth Required |
| ------------------------ | ---------------------------------------- | ------------- |
| `Register`               | Create new user, send verification email | No            |
| `VerifyEmail`            | Verify email with 6-digit code           | No            |
| `ResendVerificationCode` | Resend verification email                | No            |
| `Login`                  | Authenticate with email/password         | No            |
| `Logout`                 | Blacklist access token                   | Yes           |
| `RefreshToken`           | Get new token pair using refresh token   | No            |
| `ValidateToken`          | Validate access token (used by Gateway)  | No            |
| `GetUser`                | Get user profile by ID                   | Yes           |
| `UpdateUser`             | Update user name/avatar                  | Yes           |
| `OAuthLogin`             | Authenticate via Google/GitHub           | No            |
| `RequestPasswordReset`   | Send password reset email                | No            |
| `ResetPassword`          | Set new password with reset token        | No            |
| `HealthCheck`            | Service health status with DB check      | No            |

## HTTP Health Endpoints

For deployment keep-alive and monitoring:

| Endpoint        | Description                    | Response                           |
| --------------- | ------------------------------ | ---------------------------------- |
| `GET /health`       | Basic health check             | `{ status, service, timestamp }`   |
| `GET /health/ready` | Readiness check (DB connected) | `{ status, database, timestamp }`  |
| `GET /health/live`  | Liveness check                 | `{ status, timestamp }`            |

## Authentication Flow

### Email/Password Registration

```
1. Client → Gateway: POST /auth/register {email, password, name}
2. Gateway → Auth Service: gRPC Register()
3. Auth Service: Create user, generate 6-digit code
4. Auth Service → Brevo: Send verification email
5. Auth Service → Gateway → Client: {success, user_id}
6. Client → Gateway: POST /auth/verify-email {userId, code}
7. Gateway → Auth Service: gRPC VerifyEmail()
8. Auth Service: Mark verified, generate tokens
9. Auth Service → Gateway → Client: {tokens, user}
```

### OAuth Flow

```
1. Client: Redirect to Google/GitHub OAuth URL
2. Provider: User authorizes, redirects with code
3. Client → Gateway: POST /auth/oauth/google {code, redirectUri}
4. Gateway → Auth Service: gRPC OAuthLogin()
5. Auth Service → Google/GitHub: Exchange code for access token
6. Auth Service → Google/GitHub: Fetch user info
7. Auth Service: Find/create user, generate tokens
8. Auth Service → Gateway → Client: {tokens, user}
```

### Token Refresh

```
1. Client: Access token expired
2. Client → Gateway: POST /auth/refresh {refreshToken}
3. Gateway → Auth Service: gRPC RefreshToken()
4. Auth Service: Validate refresh token, delete old one (rotation)
5. Auth Service: Generate new token pair
6. Auth Service → Gateway → Client: {new tokens}
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

Create a `.env` file (see `sample.env`):

```env
# Server
PORT=50051
NODE_ENV=development

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

## Database Schema

```prisma
model User {
  id                     String    @id @default(uuid())
  email                  String    @unique
  password               String?
  name                   String
  avatarUrl              String?
  isVerified             Boolean   @default(false)
  verificationCode       String?
  verificationCodeExpiry DateTime?
  googleId               String?   @unique
  githubId               String?   @unique
  plan                   String    @default("free")
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  user      User     @relation(...)
}

model PasswordReset {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  used      Boolean  @default(false)
  user      User     @relation(...)
}
```

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **Token Blacklisting**: Revoked tokens stored in Redis until expiry
- **Token Rotation**: Old refresh token deleted when new pair issued
- **Rate Limiting**: Handled by Gateway
- **Input Validation**: DTO validation with class-validator

## Scripts

```bash
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm lint         # ESLint
pnpm test         # Run tests
```

## Proto Definition

The gRPC interface is defined in `proto/auth.proto`. See the Gateway README for the full proto definition.
