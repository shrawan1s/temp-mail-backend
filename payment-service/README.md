# Payment Service

The Payment Service is an HTTP microservice that handles subscription plans, Razorpay payments, and user subscriptions for the TempMail Pro application.

## Architecture

```
┌─────────────┐      HTTP        ┌─────────────────┐
│   Gateway   │ ──────────────►  │ Payment Service │
└─────────────┘                  └────────┬────────┘
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

- **Framework**: NestJS with HTTP transport
- **Database**: PostgreSQL via Prisma ORM
- **Payment Gateway**: Razorpay
- **Monitoring**: New Relic APM

## Project Structure

```
src/
├── payment/                   # Payment module
│   ├── payment.controller.ts  # HTTP endpoints
│   ├── payment.service.ts     # Business logic
│   ├── payment.module.ts
│   └── razorpay.service.ts    # Razorpay SDK wrapper
├── prisma/                    # Database client
│   └── prisma.service.ts
├── config/                    # Configuration
│   └── app.config.ts
├── constants/                 # Response messages, CORS config
│   ├── messages.ts
│   └── cors.constants.ts
├── enums/                     # TypeScript enums
│   └── payment.enum.ts        # PlanKey, BillingCycle, PaymentStatus, etc.
├── guards/                    # InternalApiKeyGuard
├── interfaces/                # TypeScript interfaces
│   └── payment.interface.ts
├── app.module.ts
└── main.ts
```

## HTTP Endpoints

| Method | Endpoint        | Description                             | Guard            |
| ------ | --------------- | --------------------------------------- | ---------------- |
| GET    | `/plans`        | Fetch all active subscription plans     | Internal API Key |
| POST   | `/orders`       | Create Razorpay order for plan purchase | Internal API Key |
| POST   | `/verify`       | Verify payment after Razorpay checkout  | Internal API Key |
| GET    | `/subscription` | Get user's current subscription         | Internal API Key |

## Health Endpoints

| Endpoint            | Description                    | Response                          |
| ------------------- | ------------------------------ | --------------------------------- |
| GET `/health`       | Basic health check             | `{ status, service, timestamp }`  |
| GET `/health/ready` | Readiness check (DB connected) | `{ status, database, timestamp }` |
| GET `/health/live`  | Liveness check                 | `{ status, timestamp }`           |

## Payment Flow

### 1. Get Available Plans

```
Frontend: Display pricing page
        ↓
Gateway: GET /api/v1/payments/plans
        ↓
Payment Service: GET /plans
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
Payment Service: POST /orders
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
Payment Service: POST /verify
  1. Verify HMAC signature (orderId + paymentId)
  2. Validate payment record exists
  3. Check payment belongs to requesting user
  4. Check not already verified
  5. Create/update subscription (transaction)
  6. Update user's plan field
        ↓
Returns: { success, planKey, expiresAt }
```

## Enums

Located in `src/enums/payment.enum.ts`:

| Enum                 | Values                           |
| -------------------- | -------------------------------- |
| `PlanKey`            | `FREE`, `PRO`, `BUSINESS`        |
| `BillingCycle`       | `MONTHLY`, `ANNUAL`              |
| `PaymentStatus`      | `PENDING`, `SUCCESS`, `FAILED`   |
| `SubscriptionStatus` | `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `Currency`           | `INR`, `USD`                     |

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
PORT=5002
NODE_ENV=development

# Internal API Key (for service-to-service auth)
INTERNAL_API_KEY=your-internal-api-key

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
- **Internal API Key**: Service-to-service authentication

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

## Scripts

```bash
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm lint         # ESLint
pnpm test         # Run tests
```

## Testing with Razorpay

### Test Card Numbers

| Card Type | Number              | CVV          | Expiry          |
| --------- | ------------------- | ------------ | --------------- |
| Success   | 4111 1111 1111 1111 | Any 3 digits | Any future date |
| Failure   | 4000 0000 0000 0002 | Any          | Any             |

### Test UPI ID

- `success@razorpay` - Always succeeds
- `failure@razorpay` - Always fails
