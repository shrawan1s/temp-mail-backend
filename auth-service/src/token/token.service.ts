import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';
import { RedisService } from '../redis';
import { v4 as uuidv4 } from 'uuid';
import { ITokenPair, ITokenPayload } from 'src/interfaces';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async generateTokenPair(userId: string, email: string): Promise<ITokenPair> {
    const payload: ITokenPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpiresIn', '15m'),
    });

    const refreshToken = uuidv4();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async validateAccessToken(token: string): Promise<ITokenPayload | null> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return null;
      }

      const payload = this.jwtService.verify<ITokenPayload>(token);
      return payload;
    } catch (error) {
      return null;
    }
  }

  async refreshTokens(refreshToken: string): Promise<ITokenPair | null> {
    // Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      return null;
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return null;
    }

    // Delete old refresh token (rotation)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new token pair
    return this.generateTokenPair(storedToken.userId, storedToken.user.email);
  }

  async revokeAccessToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as ITokenPayload;
      if (payload && payload.exp) {
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.redisService.blacklistToken(token, expiresIn);
        }
      }
    } catch (error) {
      this.logger.error('Error revoking access token:', error);
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // Delete all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Clear all Redis sessions
    await this.redisService.deleteAllUserSessions(userId);
  }

  // Password reset tokens
  async generatePasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken) return null;
    if (resetToken.used) return null;
    if (resetToken.expiresAt < new Date()) return null;

    return resetToken.userId;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    });
  }
}
