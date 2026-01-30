import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma';
import { RedisService } from '../../../redis';
import { ITokenPayload, ITokenPair } from '../../../common/types';
import { LOG_MESSAGES } from '../../../common/constants';
import { v4 as uuidv4 } from 'uuid';

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
   * Generate access/refresh token pair.
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
   * Validate access token.
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
   * Refresh tokens with rotation.
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

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.redisService.deleteAllUserSessions(userId);
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordReset.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken.userId;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    });
  }
}
