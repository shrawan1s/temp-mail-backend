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
  
  // Rate Limiting
  RATE_LIMIT_KEY_CREATED: (key: string, ttl: number, limit: number) => `Rate limit key created: ${key} (TTL: ${ttl}ms, Limit: ${limit})`,
  RATE_LIMIT_WARNING: (key: string, hits: number, limit: number, expires: number) => `Rate limit warning: ${key} has ${hits}/${limit} hits (expires in ${expires}ms)`,
  RATE_LIMIT_EXCEEDED: (ip: string) => `Rate limit exceeded for IP: ${ip}`,
  REDIS_INCREMENT_ERROR: (key: string, message: string) => `Redis increment error for key ${key}: ${message}`,
  
  // IP Detection
  IP_DETECTION: (count: number, ip: string, forwardedFor: string) => `IP Detection [${count}] - req.ip: ${ip}, X-Forwarded-For: ${forwardedFor}`,
} as const;

/**
 * API configuration constants.
 */
export const API_CONFIG = {
  PREFIX: 'api/v1',
  VERSION: 'v1',
} as const;
