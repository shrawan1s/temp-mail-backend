import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma';
import { RedisService } from '../../../redis';
import { ITokenPayload, ITokenPair } from '../../../common/types';
import { LOG_MESSAGES } from '../../../common/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Token Service
 *
 * Manages JWT access tokens and refresh tokens for authentication.
 * Implements token generation, validation, rotation, and revocation.
 * Uses Redis for token blacklisting and Prisma for refresh token storage.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Generates a new access/refresh token pair.
   * Access token is a signed JWT, refresh token is a UUID stored in database.
   * Refresh tokens expire in 7 days.
   * @param userId - The user's UUID
   * @param email - The user's email (included in JWT payload)
   * @returns Token pair containing accessToken and refreshToken
   */
  async generateTokenPair(userId: string, email: string): Promise<ITokenPair> {
    const payload: ITokenPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn', '15m'),
    });

    const refreshToken = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validates a JWT access token.
   * Checks if token is blacklisted in Redis before verifying signature.
   * @param token - The JWT access token to validate
   * @returns Token payload if valid, null if invalid or blacklisted
   */
  async validateAccessToken(token: string): Promise<ITokenPayload | null> {
    try {
      const isBlacklisted = await this.redisService.isTokenBlacklisted(token);
      if (isBlacklisted) return null;

      return this.jwtService.verify<ITokenPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
      return null;
    }
  }

  /**
   * Refreshes tokens using a valid refresh token.
   * Implements token rotation - old refresh token is deleted, new pair generated.
   * @param refreshToken - The refresh token to use
   * @returns New token pair if valid, null if invalid or expired
   */
  async refreshTokens(refreshToken: string): Promise<ITokenPair | null> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) return null;

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return null;
    }

    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    return this.generateTokenPair(storedToken.userId, storedToken.user.email);
  }

  /**
   * Revokes an access token by adding it to the Redis blacklist.
   * Token remains blacklisted until its original expiration time.
   * @param token - The JWT access token to revoke
   */
  async revokeAccessToken(token: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload: any = this.jwtService.decode(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (payload?.exp) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.redisService.blacklistToken(token, expiresIn);
        }
      }
    } catch (error) {
      this.logger.error(LOG_MESSAGES.TOKEN_REVOKE_ERROR, error);
    }
  }

  /**
   * Revokes a refresh token by deleting it from the database.
   * @param refreshToken - The refresh token to revoke
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Revokes all tokens for a user (logout from all devices).
   * Deletes all refresh tokens and clears Redis sessions.
   * @param userId - The user's UUID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.redisService.deleteAllUserSessions(userId);
  }

  /**
   * Generates a password reset token with 1-hour expiry.
   * Token is stored in database for validation.
   * @param userId - The user's UUID
   * @returns The generated reset token UUID
   */
  async generatePasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordReset.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  /**
   * Validates a password reset token.
   * Checks if token exists, is not used, and not expired.
   * @param token - The password reset token
   * @returns The user's UUID if valid, null if invalid
   */
  async validatePasswordResetToken(token: string): Promise<string | null> {
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken.userId;
  }

  /**
   * Marks a password reset token as used to prevent reuse.
   * @param token - The password reset token
   */
  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    });
  }
}
