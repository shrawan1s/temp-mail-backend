/**
 * Centralized error messages for the gateway.
 * Change these to update error responses across the application.
 */
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_TOKEN_REQUIRED: 'Access token is required',
  AUTH_TOKEN_INVALID: 'Invalid or expired token',
  AUTH_TOKEN_VALIDATION_FAILED: 'Token validation failed',
  
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  
  // Service errors
  AUTH_SERVICE_ERROR: 'Auth service error',
  PAYMENT_SERVICE_ERROR: 'Payment service error',
} as const;

/**
 * Centralized log messages for the gateway.
 */
export const LOG_MESSAGES = {
  GATEWAY_STARTED: (port: number) => `🚀 Gateway is running on http://localhost:${port}`,
  API_AVAILABLE: (port: number, prefix: string) => `📚 API available at http://localhost:${port}/${prefix}`,
} as const;

/**
 * API configuration constants.
 */
export const API_CONFIG = {
  PREFIX: 'api/v1',
  VERSION: 'v1',
} as const;
