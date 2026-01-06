# Payment Service

The Payment Service is a gRPC microservice that handles subscription plans, Razorpay payments, and user subscriptions for the TempMail Pro application.

## Architecture

```
┌─────────────┐      gRPC       ┌─────────────────┐
│   Gateway   │ ──────────────► │ Payment Service │
└─────────────┘                 └────────┬────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌──────────┐         ┌───────────┐        ┌───────────┐
             │PostgreSQL│         │ Razorpay  │        │ New Relic │
             │(Prisma)  │         │   API     │        │Monitoring │
             └──────────┘         └───────────┘        └───────────┘
```

## Features

- **Subscription Plans** - Fetch and manage available plans (Free, Pro, Business)
- **Order Creation** - Create Razorpay orders for plan upgrades
- **Payment Verification** - Verify Razorpay payments with signature validation
- **Subscription Management** - Track active subscriptions with expiry dates
- **Upgrade Protection** - Prevent downgrades, allow only upgrades

## Tech Stack

- **Framework**: NestJS with gRPC transport
- **Database**: PostgreSQL via Prisma ORM
- **Payment Gateway**: Razorpay
- **Monitoring**: New Relic APM

## Project Structure

```
src/
├── payment/                   # Payment module
│   ├── payment.controller.ts  # gRPC methods
│   ├── payment.service.ts     # Business logic
│   ├── payment.module.ts
│   ├── razorpay.service.ts    # Razorpay SDK wrapper
│   └── constants.ts           # Response messages
├── prisma/                    # Database client
│   └── prisma.service.ts
├── config/                    # Configuration
│   └── app.config.ts
├── interfaces/                # TypeScript interfaces
│   └── payment.interface.ts
├── proto/                     # gRPC proto file
│   └── payment.proto
├── app.module.ts              # Root module
└── main.ts                    # Application bootstrap
```

## gRPC Methods

| Method            | Description                             | Auth Required |
| ----------------- | --------------------------------------- | ------------- |
| `GetPlans`        | Fetch all active subscription plans     | No            |
| `CreateOrder`     | Create Razorpay order for plan purchase | Yes           |
| `VerifyPayment`   | Verify payment after Razorpay checkout  | Yes           |
| `GetSubscription` | Get user's current subscription         | Yes           |
| `HealthCheck`     | Service health status with DB check     | No            |

## HTTP Health Endpoints

For deployment keep-alive and monitoring:

| Endpoint            | Description                    | Response                           |
| ------------------- | ------------------------------ | ---------------------------------- |
| `GET /health`       | Basic health check             | `{ status, service, timestamp }`   |
| `GET /health/ready` | Readiness check (DB connected) | `{ status, database, timestamp }`  |
| `GET /health/live`  | Liveness check                 | `{ status, timestamp }`            |

## Payment Flow

### 1. Get Available Plans

```
Frontend: Display pricing page
        ↓
Gateway: GET /api/v1/payments/plans
        ↓
Payment Service: gRPC GetPlans()
        ↓
Returns: List of plans (Free, Pro, Business) with pricing
```

### 2. Create Order (Initiate Purchase)

```
User selects plan → Frontend
        ↓
Gateway: POST /api/v1/payments/orders
{
  "planId": "uuid-of-plan",
  "billingCycle": "monthly" | "annual"
}
        ↓
Payment Service: gRPC CreateOrder()
  1. Validate plan exists
  2. Check user doesn't already have same/higher tier
  3. Create Razorpay order via API
  4. Store payment record (status: pending)
        ↓
Returns: { orderId, amount, currency, razorpayKeyId }
```

### 3. Razorpay Checkout (Frontend)

```javascript
const options = {
  key: razorpayKeyId,
  amount: amount,
  currency: currency,
  order_id: orderId,
  handler: function (response) {
    // Send to backend for verification
    verifyPayment({
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature,
    });
  },
};
const rzp = new Razorpay(options);
rzp.open();
```

### 4. Verify Payment (Complete Purchase)

```
Razorpay returns payment details → Frontend
        ↓
Gateway: POST /api/v1/payments/verify
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "xxx"
}
        ↓
Payment Service: gRPC VerifyPayment()
  1. Verify HMAC signature (orderId + paymentId)
  2. Validate payment record exists
  3. Check payment belongs to requesting user
  4. Check not already verified
  5. Create/update subscription (transaction)
  6. Update user's plan field
        ↓
Returns: { success, planKey, expiresAt }
```

### 5. Get Subscription Status

```
Frontend: Check user's current plan
        ↓
Gateway: GET /api/v1/payments/subscription
        ↓
Payment Service: gRPC GetSubscription()
        ↓
Returns: { planKey, planName, status, billingCycle, expiresAt }
```

## Database Schema

```prisma
model Plan {
  id           String   @id @default(uuid())
  key          String   @unique  // "free", "pro", "business"
  name         String              // "Free", "Pro", "Business"
  description  String?
  priceMonthly Int      @default(0)  // in paise (₹299 = 29900)
  priceAnnual  Int      @default(0)  // in paise
  features     String[]            // Feature list
  isPopular    Boolean  @default(false)
  isActive     Boolean  @default(true)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  payments      Payment[]
  subscriptions Subscription[]
}

model Payment {
  id              String   @id @default(uuid())
  userId          String
  planId          String
  billingCycle    String   // "monthly" or "annual"
  razorpayOrderId String   @unique
  razorpayPayId   String?
  amount          Int
  status          String   @default("pending")  // pending, success, failed
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  plan Plan @relation(fields: [planId], references: [id])
}

model Subscription {
  id           String   @id @default(uuid())
  userId       String   @unique
  planId       String
  billingCycle String   // "monthly" or "annual"
  status       String   @default("active")  // active, expired, cancelled
  startedAt    DateTime @default(now())
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  plan Plan @relation(fields: [planId], references: [id])
}
```

## Plan Tier System

Plans are ordered by tier to prevent downgrades:

| Tier | Plan Key   | Plan Name |
| ---- | ---------- | --------- |
| 0    | `free`     | Free      |
| 1    | `pro`      | Pro       |
| 2    | `business` | Business  |

**Rules:**

- Users can only upgrade (higher tier)
- Downgrades are not allowed via payment
- Free users can upgrade to Pro or Business
- Pro users can upgrade to Business

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (shared database)
- Razorpay account with API keys
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Seed plans (optional)
npx prisma db seed

# Start development server
pnpm start:dev
```

### Environment Variables

Create a `.env` file:

```env
# Server
NODE_ENV=development
PAYMENT_GRPC_URL=0.0.0.0:5002

# Database (shared with all services)
DATABASE_URL=postgresql://user:pass@localhost:5432/tempmail

# Razorpay API Keys
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_key_secret

# New Relic (optional)
NEW_RELIC_APP_NAME=TempMail-Payment
NEW_RELIC_LICENSE_KEY=your_license_key
```

### Getting Razorpay Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings → API Keys**
3. Generate a new key pair
4. Copy `Key ID` and `Key Secret` to `.env`

> **Note:** Use test keys (`rzp_test_*`) for development. Switch to live keys for production.

## Security Features

- **Signature Verification**: HMAC-SHA256 verification of Razorpay signature
- **User Validation**: Payment must belong to requesting user
- **Idempotency**: Prevents double verification of same payment
- **Transaction Safety**: Prisma transactions for subscription creation

## Proto Definition

```protobuf
syntax = "proto3";
package payment;

service PaymentService {
  rpc GetPlans(GetPlansRequest) returns (GetPlansResponse);
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc VerifyPayment(VerifyPaymentRequest) returns (VerifyPaymentResponse);
  rpc GetSubscription(GetSubscriptionRequest) returns (SubscriptionResponse);
}

message Plan {
  string id = 1;
  string key = 2;
  string name = 3;
  string description = 4;
  int32 price_monthly = 5;
  int32 price_annual = 6;
  repeated string features = 7;
  bool is_popular = 8;
}

message CreateOrderRequest {
  string user_id = 1;
  string plan_id = 2;
  string billing_cycle = 3;
}

message CreateOrderResponse {
  string order_id = 1;
  int32 amount = 2;
  string currency = 3;
  string razorpay_key_id = 4;
}

message VerifyPaymentRequest {
  string order_id = 1;
  string payment_id = 2;
  string signature = 3;
  string user_id = 4;
}

message VerifyPaymentResponse {
  bool success = 1;
  string message = 2;
  string plan_key = 3;
  string expires_at = 4;
}
```

## Scripts

```bash
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm lint         # ESLint
pnpm test         # Run tests
```

## Error Messages

| Code                          | Message                           |
| ----------------------------- | --------------------------------- |
| `PLAN_NOT_FOUND`              | Plan not found                    |
| `ORDER_FREE_PLAN_ERROR`       | Cannot create order for free plan |
| `ORDER_ALREADY_SUBSCRIBED`    | Already subscribed to plan        |
| `ORDER_DOWNGRADE_NOT_ALLOWED` | Cannot downgrade to lower plan    |
| `PAYMENT_INVALID_SIGNATURE`   | Invalid payment signature         |
| `PAYMENT_RECORD_NOT_FOUND`    | Payment record not found          |
| `PAYMENT_USER_MISMATCH`       | Payment does not belong to user   |
| `PAYMENT_ALREADY_VERIFIED`    | Payment already verified          |

## Testing with Razorpay

### Test Card Numbers

| Card Type | Number              | CVV          | Expiry          |
| --------- | ------------------- | ------------ | --------------- |
| Success   | 4111 1111 1111 1111 | Any 3 digits | Any future date |
| Failure   | 4000 0000 0000 0002 | Any          | Any             |

### Test UPI ID

- `success@razorpay` - Always succeeds
- `failure@razorpay` - Always fails
