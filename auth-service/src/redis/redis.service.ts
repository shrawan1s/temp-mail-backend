import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service for Redis operations.
 * Handles token blacklisting, session management, and rate limiting.
 * Redis is a REQUIRED dependency for production.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_MS = 3000;

  constructor(private configService: ConfigService) {}

  /** Initialize Redis connection on module startup with retry logic */
  async onModuleInit() {
    const host = this.configService.get<string>('redis.host');
    const port = this.configService.get<number>('redis.port');
    const username = this.configService.get<string>('redis.username');
    const password = this.configService.get<string>('redis.password');

    if (!host) {
      throw new Error('REDIS_HOST is required but not configured');
    }

    this.client = new Redis({
      host,
      port: port || 6379,
      username,
      password,
      maxRetriesPerRequest: null, // Disable per-request retry limit for connection
      enableReadyCheck: true,
      lazyConnect: true, // Don't connect immediately, we'll do it manually with retries
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Reconnecting to Redis...');
    });

    // Connect with retry logic
    await this.connectWithRetry();
  }

  /** Connect to Redis with exponential backoff retry */
  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.client.connect();
        // Verify connection with PING
        await this.client.ping();
        this.isConnected = true;
        this.logger.log(`Redis connected successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        this.logger.warn(
          `Redis connection attempt ${attempt}/${this.MAX_RETRIES} failed: ${(error as Error).message}`,
        );

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * attempt; // Exponential backoff
          this.logger.log(`Retrying in ${delay / 1000} seconds...`);
          await this.sleep(delay);
        } else {
          this.logger.error('Redis connection failed after all retries');
          throw new Error(
            `Failed to connect to Redis after ${this.MAX_RETRIES} attempts. ` +
            `Check REDIS_HOST, REDIS_PORT, REDIS_USERNAME, and REDIS_PASSWORD.`,
          );
        }
      }
    }
  }

  /** Sleep helper for retry delays */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Close Redis connection on module shutdown */
  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.logger.log('Disconnected from Redis');
    }
  }

  /** Check if Redis is connected and available */
  isAvailable(): boolean {
    return this.isConnected;
  }

  /** Get the underlying Redis client for custom operations */
  getClient(): Redis {
    return this.client;
  }

  // ═══════════════════════════════════════════════════════════════
  // TOKEN BLACKLIST - Used for logout and token revocation
  // ═══════════════════════════════════════════════════════════════

  /**
   * Add a token to the blacklist until it expires.
   * Used when user logs out or token is revoked.
   * @param token - The JWT access token to blacklist
   * @param expiresInSeconds - Time until token naturally expires
   */
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.client.setex(`blacklist:${token}`, expiresInSeconds, '1');
  }

  /**
   * Check if a token has been blacklisted (revoked).
   * Called during token validation.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result === '1';
  }

  // ═══════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT - Store active user sessions
  // ═══════════════════════════════════════════════════════════════

  /**
   * Store session data for a user.
   * @param userId - User ID
   * @param sessionId - Unique session identifier
   * @param data - Session data (JSON string)
   * @param expiresInSeconds - Session TTL
   */
  async setSession(userId: string, sessionId: string, data: string, expiresInSeconds: number): Promise<void> {
    await this.client.setex(`session:${userId}:${sessionId}`, expiresInSeconds, data);
  }

  /** Retrieve session data */
  async getSession(userId: string, sessionId: string): Promise<string | null> {
    return this.client.get(`session:${userId}:${sessionId}`);
  }

  /** Delete a specific session */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.client.del(`session:${userId}:${sessionId}`);
  }

  /**
   * Delete all sessions for a user.
   * Used during password change or security logout.
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    const keys = await this.client.keys(`session:${userId}:*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RATE LIMITING - Prevent abuse
  // ═══════════════════════════════════════════════════════════════

  /**
   * Increment rate limit counter for a key.
   * Sets expiry on first increment.
   * @param key - Rate limit key (e.g., "login:user@email.com")
   * @param windowSeconds - Rate limit window duration
   * @returns Current count for this window
   */
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    const current = await this.client.incr(`ratelimit:${key}`);
    if (current === 1) {
      await this.client.expire(`ratelimit:${key}`, windowSeconds);
    }
    return current;
  }

  /** Get current rate limit count for a key */
  async getRateLimit(key: string): Promise<number> {
    const result = await this.client.get(`ratelimit:${key}`);
    return result ? parseInt(result, 10) : 0;
  }
}
