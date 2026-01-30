export const API_CONFIG = {
  PREFIX: 'api/v1',
  VERSION: 'v1',
} as const;

export const REDIS_PREFIXES = {
  BLACKLIST: 'blacklist:',
  SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
} as const;
