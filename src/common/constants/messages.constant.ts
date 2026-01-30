// AUTH MESSAGES
export const AUTH_MESSAGES = {
  // Registration
  REGISTER_SUCCESS:
    'Registration successful. Please check your email for verification code.',
  REGISTER_FAILED: 'Registration failed',
  USER_ALREADY_EXISTS: 'User with this email already exists',

  // Email Verification
  VERIFY_SUCCESS: 'Email verified successfully',
  VERIFY_FAILED: 'Email verification failed',
  VERIFY_INVALID_CODE: 'Invalid or expired verification code',
  RESEND_CODE_SUCCESS: 'Verification code sent',
  RESEND_CODE_HINT:
    'If the email exists and is not verified, a new code will be sent',
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
  PASSWORD_RESET_HINT:
    'If the email exists, a password reset link will be sent',
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
  NO_PASSWORD_SET:
    'No password set for this account. Please use OAuth to login.',

  // Delete Account
  ACCOUNT_DELETED: 'Account deleted successfully',
  ACCOUNT_DELETE_FAILED: 'Failed to delete account',
  PASSWORD_REQUIRED_FOR_DELETE: 'Password is required to delete account',
} as const;

// PAYMENT MESSAGES
export const PAYMENT_MESSAGES = {
  PLANS_FETCHED: 'Plans fetched successfully',
  PLANS_FETCH_SUCCESS: 'Plans fetched successfully',
  PLANS_FETCH_FAILED: 'Failed to fetch plans',
  PLAN_NOT_FOUND: 'Plan not found',

  ORDER_CREATED: 'Order created successfully',
  ORDER_CREATION_FAILED: 'Failed to create order',
  ORDER_FREE_PLAN_ERROR: 'Cannot create order for free plan',
  ORDER_ALREADY_SUBSCRIBED:
    'You already have an active subscription for this plan',
  ORDER_DOWNGRADE_NOT_ALLOWED:
    'Downgrades are not supported. Please contact support.',

  PAYMENT_VERIFIED: 'Payment verified successfully',
  PAYMENT_VERIFICATION_FAILED: 'Payment verification failed',
  PAYMENT_INVALID_SIGNATURE: 'Invalid payment signature',
  PAYMENT_RECORD_NOT_FOUND: 'Payment record not found',
  PAYMENT_USER_MISMATCH: 'Payment verification failed - user mismatch',
  PAYMENT_ALREADY_VERIFIED: 'Payment already verified',

  SUBSCRIPTION_FETCHED: 'Subscription fetched successfully',
  SUBSCRIPTION_FETCH_SUCCESS: 'Subscription fetched successfully',
  SUBSCRIPTION_FETCH_FAILED: 'Failed to fetch subscription',
  SUBSCRIPTION_NOT_FOUND: 'No active subscription found',
} as const;

// ERROR MESSAGES
export const ERROR_MESSAGES = {
  AUTH_TOKEN_REQUIRED: 'Access token is required',
  AUTH_TOKEN_INVALID: 'Invalid or expired token',
  AUTH_TOKEN_VALIDATION_FAILED: 'Token validation failed',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
} as const;
