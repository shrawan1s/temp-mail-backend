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

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
