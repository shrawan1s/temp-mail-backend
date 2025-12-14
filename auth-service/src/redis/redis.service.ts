import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service for Redis operations.
 * Handles token blacklisting, session management, and rate limiting.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  /** Initialize Redis connection on module startup */
  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  /** Close Redis connection on module shutdown */
  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Disconnected from Redis');
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
