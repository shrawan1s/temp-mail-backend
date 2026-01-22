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

  // Settings
  SETTINGS_FETCH_SUCCESS: 'Settings fetched successfully',
  SETTINGS_FETCH_FAILED: 'Failed to fetch settings',
  SETTINGS_UPDATE_SUCCESS: 'Settings updated successfully',
  SETTINGS_UPDATE_FAILED: 'Failed to update settings',

  // Change Password
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
  PASSWORD_CHANGE_FAILED: 'Failed to change password',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  NO_PASSWORD_SET: 'No password set for this account. Please use OAuth to login.',

  // Delete Account
  ACCOUNT_DELETED: 'Account deleted successfully',
  ACCOUNT_DELETE_FAILED: 'Failed to delete account',
  PASSWORD_REQUIRED_FOR_DELETE: 'Password is required to delete account',
} as const;

/**
 * Log messages for the Auth Service.
 */
export const LOG_MESSAGES = {
  // Service
  SERVICE_STARTED: (port: number) => `🔐 Auth Service running on http://0.0.0.0:${port}`,
  HEALTH_ENDPOINT: (port: number) => `🩺 Health endpoint: http://0.0.0.0:${port}/health`,

  // Registration
  USER_REGISTERED: (email: string) => `User registered: ${email}, verification code sent`,

  // Email Verification
  EMAIL_VERIFIED: (email: string) => `Email verified: ${email}`,
  VERIFICATION_CODE_RESENT: (email: string) => `Verification code resent to: ${email}`,
  VERIFICATION_EMAIL_SENT: (email: string) => `Verification email sent to ${email}`,

  // Login/Logout
  USER_LOGGED_IN: (email: string) => `User logged in: ${email}`,
  USER_LOGGED_OUT: (userId: string) => `User logged out: ${userId}`,

  // OAuth
  OAUTH_LOGIN_SUCCESS: (email: string, provider: string) => `OAuth login successful: ${email} via ${provider}`,

  // Password Reset
  PASSWORD_RESET_REQUESTED: (email: string) => `Password reset requested for: ${email}`,
  PASSWORD_RESET_SUCCESS: (userId: string) => `Password reset successful for user: ${userId}`,
  PASSWORD_RESET_EMAIL_SENT: (email: string) => `Password reset email sent to ${email}`,

  // Password Change
  PASSWORD_CHANGED: (userId: string) => `Password changed for user: ${userId}`,

  // Account
  ACCOUNT_DELETED: (userId: string) => `Account deleted for user: ${userId}`,
  USER_DELETED: (userId: string) => `User ${userId} deleted`,

  // Email service
  BREVO_NOT_CONFIGURED: 'Brevo API not configured, skipping email send',
  DEV_VERIFICATION_CODE: (email: string, code: string) => `[DEV] Verification code for ${email}: ${code}`,
  DEV_PASSWORD_RESET_LINK: (email: string, link: string) => `[DEV] Password reset link for ${email}: ${link}`,
  EMAIL_SEND_FAILED: (email: string) => `Failed to send email to ${email}`,

  // Errors
  REGISTRATION_ERROR: 'Registration error:',
  VERIFY_EMAIL_ERROR: 'Verify email error:',
  RESEND_VERIFICATION_ERROR: 'Resend verification error:',
  LOGIN_ERROR: 'Login error:',
  LOGOUT_ERROR: 'Logout error:',
  TOKEN_REFRESH_ERROR: 'Token refresh error:',
  GET_USER_ERROR: 'Get user error:',
  UPDATE_USER_ERROR: 'Update user error:',
  OAUTH_LOGIN_ERROR: 'OAuth login error:',
  PASSWORD_RESET_REQUEST_ERROR: 'Password reset request error:',
  PASSWORD_RESET_ERROR: 'Password reset error:',
  GET_SETTINGS_ERROR: 'Get settings error:',
  UPDATE_SETTINGS_ERROR: 'Update settings error:',
  CHANGE_PASSWORD_ERROR: 'Change password error:',
  DELETE_ACCOUNT_ERROR: 'Delete account error:',
} as const;

/**
 * Email subject lines.
 */
export const EMAIL_SUBJECTS = {
  VERIFICATION: 'Verify your email - TempMail',
  PASSWORD_RESET: 'Reset your password - TempMail',
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;
