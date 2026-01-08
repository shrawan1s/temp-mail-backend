/**
 * Centralized response messages for the Auth Service.
 * Update messages here to change them across the entire service.
 */

export const AUTH_MESSAGES = {
  // Registration
  REGISTER_SUCCESS: 'Registration successful. Please check your email for verification code.',
  REGISTER_FAILED: 'Registration failed',
  USER_ALREADY_EXISTS: 'User with this email already exists',

  // Email Verification
  VERIFY_SUCCESS: 'Email verified successfully',
  VERIFY_FAILED: 'Email verification failed',
  VERIFY_INVALID_CODE: 'Invalid or expired verification code',
  RESEND_CODE_SUCCESS: 'Verification code sent',
  RESEND_CODE_HINT: 'If the email exists and is not verified, a new code will be sent',
  RESEND_CODE_FAILED: 'Failed to resend verification code',

  // Login
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_FAILED: 'Login failed',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',

  // Logout
  LOGOUT_SUCCESS: 'Logout successful',
  LOGOUT_FAILED: 'Logout failed',

  // Token
  TOKEN_REFRESHED: 'Token refreshed',
  TOKEN_REFRESH_FAILED: 'Token refresh failed',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  TOKEN_VALID: 'Token is valid',

  // User
  USER_FOUND: 'User found',
  USER_NOT_FOUND: 'User not found',
  USER_UPDATED: 'User updated',
  USER_GET_FAILED: 'Failed to get user',
  USER_UPDATE_FAILED: 'Failed to update user',

  // OAuth
  OAUTH_SUCCESS: 'OAuth login successful',
  OAUTH_FAILED: 'OAuth authentication failed',
  OAUTH_LOGIN_FAILED: 'OAuth login failed',
  OAUTH_UNSUPPORTED_PROVIDER: 'Unsupported OAuth provider',

  // Password Reset
  PASSWORD_RESET_HINT: 'If the email exists, a password reset link will be sent',
  PASSWORD_RESET_REQUEST_FAILED: 'Password reset request failed',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  PASSWORD_RESET_FAILED: 'Password reset failed',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
} as const;

/**
 * Log messages for the Auth Service.
 */
export const LOG_MESSAGES = {
  SERVICE_STARTED: (port: number) => `🔐 Auth Service running on http://0.0.0.0:${port}`,
  HEALTH_ENDPOINT: (port: number) => `🩺 Health endpoint: http://0.0.0.0:${port}/health`,
  USER_REGISTERED: (email: string) => `User registered: ${email}, verification code sent`,
  VERIFICATION_EMAIL_SENT: (email: string) => `Verification email sent to ${email}`,
  PASSWORD_RESET_EMAIL_SENT: (email: string) => `Password reset email sent to ${email}`,
  BREVO_NOT_CONFIGURED: 'Brevo API not configured, skipping email send',
  DEV_VERIFICATION_CODE: (email: string, code: string) => `[DEV] Verification code for ${email}: ${code}`,
  DEV_PASSWORD_RESET_LINK: (email: string, link: string) => `[DEV] Password reset link for ${email}: ${link}`,
  EMAIL_SEND_FAILED: (email: string) => `Failed to send email to ${email}`,
} as const;

/**
 * Email subject lines.
 */
export const EMAIL_SUBJECTS = {
  VERIFICATION: 'Verify your email - TempMail',
  PASSWORD_RESET: 'Reset your password - TempMail',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
