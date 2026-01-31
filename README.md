# TempMail Pro - Backend

A robust, scalable NestJS backend for the TempMail Pro temporary email service. Built as a modular monolith with TypeScript, Prisma ORM, Redis caching, Razorpay payments, and comprehensive authentication.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Payment Integration](#payment-integration)
- [Configuration](#configuration)
- [Setup](#setup)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security](#security)
- [Key Files Reference](#key-files-reference)

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (NestJS Modular Monolith)                     │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                           Global Middleware                             │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │  │
│  │  │   JwtAuthGuard │  │ ThrottlerGuard │  │ GlobalExceptionFilter      │ │  │
│  │  │   (JWT + Redis)│  │ (Rate Limiting)│  │ (Error Handling)           │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                        │
│  ┌───────────────────────────────────┼──────────────────────────────────────┐ │
│  │                          Feature Modules                                 │ │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │ │
│  │  │   AuthModule    │  │ PaymentModule  │  │      HealthModule          │ │ │
│  │  │  ├─ UserService │  │  ├─ Razorpay   │  │  └─ Health check           │ │ │
│  │  │  ├─ TokenService│  │  └─ Plans/Subs │  └────────────────────────────┘ │ │
│  │  │  ├─ OAuthService│  └────────────────┘                                 │ │
│  │  │  └─ AuthService │                                                     │ │
│  │  └─────────────────┘                                                     │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                        │
│  ┌───────────────────────────────────┼─────────────────────────────────────┐  │
│  │                           Core Modules                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ PrismaModule │  │  RedisModule │  │        EmailModule           │   │  │
│  │  │ (PostgreSQL) │  │  (ioredis)   │  │        (Brevo SMTP)          │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────────────────────┘   │  │
│  └─────────┼─────────────────┼─────────────────────────────────────────────┘  │
│            │                 │                                                │
└────────────┼─────────────────┼────────────────────────────────────────────────┘
             │                 │
             ▼                 ▼
    ┌────────────────┐  ┌────────────────┐
    │   PostgreSQL   │  │     Redis      │
    │   (Database)   │  │ (Cache/Session)│
    └────────────────┘  └────────────────┘
```

---

## Tech Stack

| Category              | Technology                              |
| --------------------- | --------------------------------------- |
| **Framework**         | NestJS 11                               |
| **Language**          | TypeScript 5                            |
| **ORM**               | Prisma 5.22                             |
| **Database**          | PostgreSQL                              |
| **Cache/Session**     | Redis (ioredis)                         |
| **Authentication**    | JWT (@nestjs/jwt)                       |
| **Rate Limiting**     | @nestjs/throttler + Redis storage       |
| **Payment Gateway**   | Razorpay                                |
| **Email Service**     | Brevo (Sendinblue)                      |
| **Monitoring**        | New Relic                               |
| **Validation**        | class-validator + class-transformer    |
| **Build Tool**        | SWC (fast TypeScript compiler)          |

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma                 # Database schema
│
├── src/
│   ├── main.ts                       # Application entry point
│   ├── app.module.ts                 # Root module
│   │
│   ├── common/                       # Shared utilities
│   │   ├── constants/                # Application constants
│   │   │   ├── config.constant.ts    # API config
│   │   │   ├── messages.constant.ts  # Response messages
│   │   │   └── logs.constant.ts      # Log messages
│   │   │
│   │   ├── decorators/               # Custom decorators
│   │   │   ├── public.decorator.ts   # @Public() - skip auth
│   │   │   └── current-user.decorator.ts  # @CurrentUser()
│   │   │
│   │   ├── enums/                    # Application enums
│   │   │   └── index.ts              # OAuthProvider, PlanKey, etc.
│   │   │
│   │   ├── filters/                  # Exception filters
│   │   │   └── global-exception.filter.ts
│   │   │
│   │   ├── guards/                   # Auth guards
│   │   │   └── jwt-auth.guard.ts     # JWT + Redis blacklist
│   │   │
│   │   └── types/                    # TypeScript interfaces
│   │       ├── auth.types.ts
│   │       ├── payment.types.ts
│   │       └── common.types.ts
│   │
│   ├── config/                       # Configuration modules
│   │   ├── app.config.ts             # Port, CORS, env
│   │   ├── jwt.config.ts             # JWT secret, expiry
│   │   ├── redis.config.ts           # Redis connection
│   │   ├── oauth.config.ts           # Google, GitHub OAuth
│   │   ├── razorpay.config.ts        # Razorpay keys
│   │   ├── throttle.config.ts        # Rate limiting
│   │   └── email.config.ts           # Brevo SMTP
│   │
│   ├── prisma/                       # Prisma module
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts         # Database connection + retry
│   │
│   ├── redis/                        # Redis module
│   │   ├── redis.module.ts
│   │   └── redis.service.ts          # Redis client + utilities
│   │
│   └── modules/                      # Feature modules
│       │
│       ├── auth/                     # Authentication module
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts    # Auth endpoints
│       │   ├── auth.service.ts       # Auth business logic
│       │   │
│       │   ├── dto/                  # Request DTOs
│       │   │   └── index.ts          # RegisterDto, LoginDto, etc.
│       │   │
│       │   ├── user/                 # User sub-module
│       │   │   ├── user.module.ts
│       │   │   └── user.service.ts   # User CRUD operations
│       │   │
│       │   ├── token/                # Token sub-module
│       │   │   ├── token.module.ts
│       │   │   └── token.service.ts  # JWT generation/validation
│       │   │
│       │   └── oauth/                # OAuth sub-module
│       │       ├── oauth.module.ts
│       │       └── oauth.service.ts  # Google/GitHub handlers
│       │
│       ├── payment/                  # Payment module
│       │   ├── payment.module.ts
│       │   ├── payment.controller.ts # Payment endpoints
│       │   ├── payment.service.ts    # Payment business logic
│       │   ├── razorpay.service.ts   # Razorpay SDK wrapper
│       │   └── dto/
│       │       └── index.ts          # CreateOrderDto, etc.
│       │
│       ├── email/                    # Email module
│       │   ├── email.module.ts
│       │   ├── email.service.ts      # Brevo transactional emails
│       │   └── templates.ts          # Email HTML templates
│       │
│       └── health/                   # Health check module
│           ├── health.module.ts
│           └── health.controller.ts  # Health endpoint
│
├── Dockerfile                        # Docker build configuration
├── render.yaml                       # Render deployment config
├── newrelic.js                       # New Relic configuration
└── example.env                       # Environment template
```

---

## Features

### Authentication

| Feature                  | Description                              |
| ------------------------ | ---------------------------------------- |
| Email/Password Register  | With 6-digit email verification          |
| Email/Password Login     | JWT access + refresh token pair          |
| OAuth Login              | Google and GitHub providers              |
| Password Reset           | Token-based email reset flow             |
| Token Refresh            | Automatic refresh with rotation          |
| Token Blacklisting       | Redis-backed logout/revocation           |
| Session Management       | Track and revoke user sessions           |

### User Management

| Feature                  | Description                              |
| ------------------------ | ---------------------------------------- |
| Profile Management       | Update name, avatar                      |
| Settings                 | Dark mode, notifications, email expiry   |
| Password Change          | Current + new password validation        |
| Account Deletion         | Soft delete with password confirmation   |

### Payment

| Feature                  | Description                              |
| ------------------------ | ---------------------------------------- |
| Plan Management          | Free, Pro, Business tiers                |
| Razorpay Integration     | Order creation and signature verification|
| Subscription Management  | Monthly/Annual billing cycles            |
| Upgrade Protection       | Prevent downgrades, allow upgrades       |

### Infrastructure

| Feature                  | Description                              |
| ------------------------ | ---------------------------------------- |
| Rate Limiting            | Redis-backed throttling                  |
| Health Checks            | Load balancer endpoint                   |
| Global Exception Handling| Consistent error responses               |
| Request Validation       | DTO validation with class-validator      |
| Monitoring               | New Relic APM integration                |

---

## Database Schema

### User Models

```prisma
model User {
  id                     String    @id @default(uuid())
  email                  String    @unique
  password               String?   // Nullable for OAuth users
  name                   String
  avatarUrl              String?
  plan                   String    @default("free")
  isVerified             Boolean   @default(false)
  verificationCode       String?
  verificationCodeExpiry DateTime?
  googleId               String?   @unique
  githubId               String?   @unique
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  refreshTokens          RefreshToken[]
  passwordResets         PasswordReset[]
  sessions               Session[]
  settings               UserSettings?
}

model UserSettings {
  id              String   @id @default(uuid())
  userId          String   @unique
  darkMode        Boolean  @default(false)
  autoRefresh     Boolean  @default(true)
  emailExpiry     String   @default("24h")
  notifications   Boolean  @default(true)
  blockedSenders  String[] @default([])
}
```

### Auth Models

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordReset {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  accessToken String   @unique
  userAgent   String?
  ipAddress   String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}
```

### Payment Models

```prisma
model Plan {
  id            String   @id @default(uuid())
  key           String   @unique  // "free" | "pro" | "business"
  name          String
  description   String?
  priceMonthly  Int      @default(0)  // in paise
  priceAnnual   Int      @default(0)
  features      String[]
  isActive      Boolean  @default(true)
  isPopular     Boolean  @default(false)
  sortOrder     Int      @default(0)
  
  subscriptions Subscription[]
}

model Subscription {
  id            String   @id @default(uuid())
  userId        String   @unique
  planId        String
  billingCycle  String   // "monthly" | "annual"
  status        String   @default("active")
  razorpaySubId String?
  startedAt     DateTime @default(now())
  expiresAt     DateTime
}

model Payment {
  id              String   @id @default(uuid())
  userId          String
  planId          String
  billingCycle    String
  razorpayOrderId String   @unique
  razorpayPayId   String?
  amount          Int      // in paise
  status          String   @default("pending")
  createdAt       DateTime @default(now())
}
```

---

## API Reference

### Base URL

```
/api/v1
```

### Authentication Endpoints

| Method | Endpoint                    | Auth | Description                |
| ------ | --------------------------- | ---- | -------------------------- |
| POST   | `/auth/register`            | ❌   | Register new user          |
| POST   | `/auth/verify-email`        | ❌   | Verify email with code     |
| POST   | `/auth/resend-verification` | ❌   | Resend verification code   |
| POST   | `/auth/login`               | ❌   | Login with credentials     |
| POST   | `/auth/refresh`             | ❌   | Refresh access token       |
| POST   | `/auth/oauth`               | ❌   | OAuth login (Google/GitHub)|
| POST   | `/auth/password-reset/request` | ❌ | Request password reset     |
| POST   | `/auth/password-reset/confirm` | ❌ | Confirm password reset     |
| POST   | `/auth/logout`              | ✅   | Logout (blacklist token)   |
| GET    | `/auth/me`                  | ✅   | Get current user           |
| PUT    | `/auth/me`                  | ✅   | Update user profile        |
| GET    | `/auth/settings`            | ✅   | Get user settings          |
| PUT    | `/auth/settings`            | ✅   | Update user settings       |
| POST   | `/auth/change-password`     | ✅   | Change password            |
| DELETE | `/auth/account`             | ✅   | Delete account             |

### Payment Endpoints

| Method | Endpoint                | Auth | Description              |
| ------ | ----------------------- | ---- | ------------------------ |
| GET    | `/payment/plans`        | ❌   | Get all plans            |
| POST   | `/payment/create-order` | ✅   | Create Razorpay order    |
| POST   | `/payment/verify`       | ✅   | Verify payment           |
| GET    | `/payment/subscription` | ✅   | Get user subscription    |

### Health Endpoints

| Method | Endpoint    | Auth | Description              |
| ------ | ----------- | ---- | ------------------------ |
| GET    | `/health`   | ❌   | Health check             |

### Response Format

All API responses follow this structure:

```typescript
// Success Response
{
  success: true,
  message: "Operation successful",
  data: { ... }
}

// Error Response
{
  success: false,
  message: "Error description",
  data: null
}
```

---

## Authentication

### JWT Strategy

The backend uses JWT with refresh token rotation:

1. **Access Token**: Short-lived (15 min), stored in memory
2. **Refresh Token**: Long-lived (7 days), stored in database
3. **Token Blacklist**: Redis-backed for revoked tokens

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Guard     │────▶│   Handler   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Is Public?  │ │Extract Token│ │Check Redis  │
    │   (@Public) │ │ from Header │ │  Blacklist  │
    └─────────────┘ └─────────────┘ └─────────────┘
            │             │             │
            │             ▼             ▼
            │       ┌─────────────┐ ┌─────────────┐
            │       │ Verify JWT  │ │ Token Valid │
            │       │   Payload   │ │  Not Revoked│
            │       └─────────────┘ └─────────────┘
            │             │             │
            └─────────────┴─────────────┘
                          │
                          ▼
                  ┌─────────────┐
                  │ Set req.user│
                  └─────────────┘
```

### Custom Decorators

```typescript
// Skip authentication
@Public()
@Post('login')
async login() { ... }

// Get current user
@Get('me')
async getMe(@CurrentUser() user: ICurrentUser) {
  // user = { userId: string, email: string }
}
```

### OAuth Providers

| Provider | Endpoints Used                              |
| -------- | ------------------------------------------- |
| Google   | `oauth2.googleapis.com/token`               |
|          | `googleapis.com/oauth2/v2/userinfo`         |
| GitHub   | `github.com/login/oauth/access_token`       |
|          | `api.github.com/user`                       |
|          | `api.github.com/user/emails`                |

---

## Payment Integration

### Razorpay Flow

```
1. Client requests order
   POST /payment/create-order { planId, billingCycle }
        ↓
2. Backend creates Razorpay order
   → Stores Payment record (pending)
   → Returns orderId, amount, razorpayKeyId
        ↓
3. Client opens Razorpay checkout
        ↓
4. User completes payment
        ↓
5. Client sends verification
   POST /payment/verify { orderId, paymentId, signature }
        ↓
6. Backend verifies signature
   → Updates Payment (success)
   → Creates/Updates Subscription
   → Updates User plan
        ↓
7. Response: { planKey, expiresAt }
```

### Plan Hierarchy

```typescript
const PLAN_TIER_ORDER = {
  'free': 0,
  'pro': 1,
  'business': 2,
};
```

**Rules**:
- Users can only upgrade (tier N → tier > N)
- Downgrades are not allowed
- Free plan cannot create orders

---

## Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tempmail

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth - GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Email (Brevo)
BREVO_API_KEY=
SENDER_EMAIL=noreply@tempmail.com
SENDER_NAME=TempMail

# New Relic
NEW_RELIC_LICENSE_KEY=
NEW_RELIC_APP_NAME=
```

### Configuration Modules

| Module               | Loaded From                    |
| -------------------- | ------------------------------ |
| `appConfig`          | PORT, NODE_ENV, CORS_ORIGIN    |
| `jwtConfig`          | JWT_SECRET, JWT_*_EXPIRES_IN   |
| `redisConfig`        | REDIS_HOST, REDIS_PORT, etc.   |
| `oauthConfig`        | GOOGLE_*, GITHUB_*             |
| `razorpayConfig`     | RAZORPAY_KEY_ID, *_SECRET      |
| `throttleConfig`     | THROTTLE_TTL, THROTTLE_LIMIT   |
| `emailConfig`        | BREVO_API_KEY, SENDER_*        |

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- Redis

### Installation

```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
pnpm install

# Copy environment file
cp example.env .env

# Edit .env with your values
nano .env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate:dev

# Start development server
pnpm start:dev
```

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Create/apply migrations (development)
pnpm db:migrate:dev

# Apply migrations (production)
pnpm db:migrate

# Push schema without migrations
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

---

## Scripts

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `pnpm start`        | Start production server               |
| `pnpm start:dev`    | Start development server (watch)      |
| `pnpm start:debug`  | Start with debugger                   |
| `pnpm start:prod`   | Start production with New Relic       |
| `pnpm build`        | Build for production                  |
| `pnpm lint`         | Run ESLint                            |
| `pnpm format`       | Format with Prettier                  |
| `pnpm test`         | Run unit tests                        |
| `pnpm test:e2e`     | Run e2e tests                         |
| `pnpm test:cov`     | Run tests with coverage               |
| `pnpm db:generate`  | Generate Prisma client                |
| `pnpm db:migrate`   | Apply migrations (production)         |
| `pnpm db:migrate:dev` | Create/apply migrations (dev)       |
| `pnpm db:push`      | Push schema without migrations        |
| `pnpm db:studio`    | Open Prisma Studio                    |

---

## Deployment

### Docker

```dockerfile
# Build image
docker build -t tempmail-backend .

# Run container
docker run -p 5000:5000 --env-file .env tempmail-backend
```

### Render

The project includes `render.yaml` for Render deployment:

```yaml
services:
  - type: web
    name: tempmail-backend
    runtime: docker
    plan: free
    healthCheckPath: /api/v1/health
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set up Redis with authentication
- [ ] Configure JWT secret (32+ characters)
- [ ] Set up OAuth credentials (production)
- [ ] Configure Razorpay live keys
- [ ] Set up Brevo for transactional emails
- [ ] Configure New Relic for monitoring
- [ ] Set appropriate rate limits
- [ ] Enable CORS for production frontend

---

## Security

### Rate Limiting

- Default: 100 requests per 60 seconds
- Redis-backed for distributed limiting
- Skip for health checks and OAuth callbacks

### Token Security

- Access tokens: Short-lived (15 min)
- Refresh tokens: Database-stored, rotated on use
- Blacklist: Redis-backed for revoked tokens
- Password: bcrypt hashed (cost factor 10)

### Request Validation

```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  // Validated automatically
}

// DTO with validation
class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### Error Handling

All errors are caught by `GlobalExceptionFilter` and return consistent responses:

```typescript
{
  success: false,
  message: "Error description",
  data: null
}
```

---

## Key Files Reference

| File                                    | Purpose                               |
| --------------------------------------- | ------------------------------------- |
| `src/main.ts`                           | Application bootstrap                 |
| `src/app.module.ts`                     | Root module with global providers     |
| `src/common/guards/jwt-auth.guard.ts`   | JWT authentication guard              |
| `src/common/decorators/public.decorator.ts` | @Public() decorator               |
| `src/common/decorators/current-user.decorator.ts` | @CurrentUser() decorator     |
| `src/common/filters/global-exception.filter.ts` | Global error handler           |
| `src/prisma/prisma.service.ts`          | Database connection service           |
| `src/redis/redis.service.ts`            | Redis client + utilities              |
| `src/modules/auth/auth.service.ts`      | Auth business logic                   |
| `src/modules/auth/token/token.service.ts` | JWT/refresh token management        |
| `src/modules/auth/oauth/oauth.service.ts` | Google/GitHub OAuth handlers        |
| `src/modules/auth/user/user.service.ts` | User CRUD operations                  |
| `src/modules/payment/payment.service.ts`| Payment business logic                |
| `src/modules/payment/razorpay.service.ts` | Razorpay SDK wrapper                |
| `src/modules/email/email.service.ts`    | Brevo email service                   |
| `src/config/index.ts`                   | Configuration exports                 |
| `prisma/schema.prisma`                  | Database schema                       |
| `Dockerfile`                            | Production Docker build               |

---

## Redis Key Patterns

| Pattern                           | Purpose                    | TTL          |
| --------------------------------- | -------------------------- | ------------ |
| `blacklist:{token}`               | Token blacklist            | Token expiry |
| `session:{userId}:{sessionId}`    | User sessions              | Session TTL  |
| `ratelimit:{key}`                 | Rate limiting              | Window TTL   |

---

## Enums Reference

```typescript
// OAuth Providers
enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

// Plan Keys
enum PlanKey {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
}

// Billing Cycles
enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

// Payment Status
enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// Subscription Status
enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}
```

---

## License

This project is proprietary software. All rights reserved.
