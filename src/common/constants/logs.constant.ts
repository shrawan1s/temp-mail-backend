export const LOG_MESSAGES = {
  // Server
  SERVER_STARTED: (port: number) =>
    `🚀 Server running on http://localhost:${port}`,
  API_AVAILABLE: (port: number, prefix: string) =>
    `📚 API available at http://localhost:${port}/${prefix}`,

  // Database
  DB_CONNECTED: '✅ Connected to PostgreSQL database',
  DB_DISCONNECTED: 'Disconnected from PostgreSQL database',
  DB_CONNECTION_FAILED: (attempt: number, max: number, msg: string) =>
    `Database connection attempt ${attempt}/${max} failed: ${msg}`,
  DB_RETRY: (delay: number) => `Retrying in ${delay / 1000} seconds...`,
  DB_MAX_RETRIES_FAILED: 'Failed to connect to database after maximum retries',

  // Redis
  REDIS_CONNECTED: 'Connected to Redis',
  REDIS_CONNECTED_ATTEMPT: (attempt: number) =>
    `Redis connected successfully on attempt ${attempt}`,
  REDIS_DISCONNECTED: 'Disconnected from Redis',
  REDIS_ERROR: (message: string) => `Redis error: ${message}`,
  REDIS_RECONNECTING: 'Reconnecting to Redis...',
  REDIS_CONNECTION_CLOSED: 'Redis connection closed',
  REDIS_CONNECTION_FAILED: (attempt: number, max: number, msg: string) =>
    `Redis connection attempt ${attempt}/${max} failed: ${msg}`,
  REDIS_RETRY: (delay: number) => `Retrying in ${delay / 1000} seconds...`,
  REDIS_MAX_RETRIES_FAILED: (max: number) =>
    `Failed to connect to Redis after ${max} attempts. Check REDIS_HOST, REDIS_PORT, REDIS_USERNAME, and REDIS_PASSWORD.`,

  // Auth - Success
  USER_REGISTERED: (email: string) => `User registered: ${email}`,
  USER_LOGGED_IN: (email: string) => `User logged in: ${email}`,
  EMAIL_VERIFIED: (email: string) => `Email verified: ${email}`,
  OAUTH_LOGIN: (email: string, provider: string) =>
    `OAuth login: ${email} via ${provider}`,
  USER_DELETED: (userId: string) => `User ${userId} deleted`,

  // Auth - Errors
  REGISTRATION_ERROR: 'Registration error',
  VERIFY_EMAIL_ERROR: 'Verify email error',
  RESEND_VERIFICATION_ERROR: 'Resend verification error',
  LOGIN_ERROR: 'Login error',
  LOGOUT_ERROR: 'Logout error',
  TOKEN_REFRESH_ERROR: 'Token refresh error',
  TOKEN_REVOKE_ERROR: 'Error revoking access token',
  OAUTH_ERROR: 'OAuth error',
  GET_USER_ERROR: 'Get user error',
  UPDATE_USER_ERROR: 'Update user error',
  PASSWORD_RESET_REQUEST_ERROR: 'Password reset request error',
  PASSWORD_RESET_ERROR: 'Password reset error',
  GET_SETTINGS_ERROR: 'Get settings error',
  UPDATE_SETTINGS_ERROR: 'Update settings error',
  CHANGE_PASSWORD_ERROR: 'Change password error',
  DELETE_ACCOUNT_ERROR: 'Delete account error',

  // OAuth
  OAUTH_GOOGLE_TOKEN_FAILED: 'Google token exchange failed',
  OAUTH_GOOGLE_USER_FAILED: 'Google user info fetch failed',
  OAUTH_GOOGLE_ERROR: 'Google OAuth error',
  OAUTH_GITHUB_TOKEN_FAILED: 'GitHub token exchange failed',
  OAUTH_GITHUB_USER_FAILED: 'GitHub user info fetch failed',
  OAUTH_GITHUB_NO_EMAIL: 'Could not get email from GitHub',
  OAUTH_GITHUB_ERROR: 'GitHub OAuth error',

  // Payment
  ORDER_CREATED: (orderId: string, userId: string, plan: string) =>
    `Order created: ${orderId} for user ${userId}, plan ${plan}`,
  PAYMENT_VERIFIED: (orderId: string, userId: string, plan: string) =>
    `Payment verified: ${orderId}, User ${userId} upgraded to ${plan}`,
  PAYMENT_INVALID_SIGNATURE: (orderId: string) =>
    `Invalid signature for order ${orderId}`,
  PAYMENT_USER_MISMATCH: (expected: string, got: string) =>
    `User mismatch: expected ${expected}, got ${got}`,

  // Email
  EMAIL_NOT_CONFIGURED: 'Brevo API not configured, skipping email send',
  EMAIL_DEV_VERIFICATION: (to: string, code: string) =>
    `[DEV] Verification code for ${to}: ${code}`,
  EMAIL_DEV_RESET: (to: string, link: string) =>
    `[DEV] Password reset link for ${to}: ${link}`,
  EMAIL_VERIFICATION_SENT: (to: string) => `Verification email sent to ${to}`,
  EMAIL_RESET_SENT: (to: string) => `Password reset email sent to ${to}`,
  EMAIL_SEND_FAILED: (to: string) => `Failed to send email to ${to}`,

  // Exceptions
  UNHANDLED_EXCEPTION: (message: string) => `Unhandled exception: ${message}`,

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: (ip: string) => `Rate limit exceeded for IP: ${ip}`,
} as const;
