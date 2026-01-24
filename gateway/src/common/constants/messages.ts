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
  
  // Redis Throttler
  REDIS_CONNECTING: (host: string, port: number) => `Connecting to Redis throttler storage at ${host}:${port}`,
  REDIS_CONNECTED: '✅ Redis throttler storage connected successfully',
  REDIS_READY: '✅ Redis throttler storage ready',
  REDIS_ERROR: (message: string) => `❌ Redis throttler error: ${message}`,
  REDIS_CLOSED: 'Redis throttler connection closed',
  REDIS_RECONNECTING: '🔄 Redis throttler reconnecting...',
  REDIS_RETRY: (attempt: number, delay: number) => `Redis throttler retry attempt ${attempt}, next retry in ${delay}ms`,
} as const;

/**
 * API configuration constants.
 */
export const API_CONFIG = {
  PREFIX: 'api/v1',
  VERSION: 'v1',
} as const;
