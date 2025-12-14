import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';
import { v4 as uuidv4 } from 'uuid';
import { ITokenPair, ITokenPayload } from 'src/interfaces';

/**
 * Service for managing JWT tokens, refresh tokens, and password reset tokens.
 * Implements token rotation, blacklisting, and secure password reset flow.
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
   * Generate a new access/refresh token pair.
   * Access token is JWT, refresh token is stored in database.
   */
  async generateTokenPair(userId: string, email: string): Promise<ITokenPair> {
    const payload: ITokenPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpiresIn', '15m'),
    });

    const refreshToken = uuidv4();

    // Store refresh token with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validate an access token.
   * Checks JWT signature and blacklist status.
   * @returns Token payload if valid, null otherwise
   */
  async validateAccessToken(token: string): Promise<ITokenPayload | null> {
    try {
      const isBlacklisted = await this.redisService.isTokenBlacklisted(token);
      if (isBlacklisted) return null;

      return this.jwtService.verify<ITokenPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Refresh tokens using a valid refresh token.
   * Implements token rotation: old refresh token is deleted, new pair is issued.
   */
  async refreshTokens(refreshToken: string): Promise<ITokenPair | null> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) return null;

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return null;
    }

    // Delete old token (rotation)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    return this.generateTokenPair(storedToken.userId, storedToken.user.email);
  }

  /** Blacklist an access token until it expires (logout) */
  async revokeAccessToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as ITokenPayload;
      if (payload?.exp) {
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.redisService.blacklistToken(token, expiresIn);
        }
      }
    } catch (error) {
      this.logger.error('Error revoking access token:', error);
    }
  }

  /** Delete a refresh token from database */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /** Revoke all tokens for a user (password change, security) */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.redisService.deleteAllUserSessions(userId);
  }

  /**
   * Generate a password reset token (valid for 1 hour).
   * @returns The reset token to include in the email link
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
   * Validate a password reset token.
   * @returns User ID if valid, null if expired/used/invalid
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

  /** Mark a password reset token as used (prevents reuse) */
  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    });
  }
}
