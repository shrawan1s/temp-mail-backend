import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { appConfig } from '../config/app.config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(dto: any) {
    const { email, password, name } = dto;
    
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Create verification token
    const verificationToken = await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await this.mailService.sendVerificationEmail(user.email, verificationToken.token);

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: any) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: appConfig.jwtSecret, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: appConfig.jwtRefreshSecret, expiresIn: '7d' },
      ),
    ]);

    // Save refresh token hash
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
      },
    };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new Error('Invalid token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Token expired');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isEmailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { message: 'Email verified successfully' };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new Error('No user from Google');
    }
    return this.handleOAuthLogin(req.user);
  }

  async githubLogin(req: any) {
    if (!req.user) {
      throw new Error('No user from GitHub');
    }
    return this.handleOAuthLogin(req.user);
  }

  private async handleOAuthLogin(oauthUser: any) {
    let user = await this.prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          name: oauthUser.firstName ? `${oauthUser.firstName} ${oauthUser.lastName}` : oauthUser.username,
          passwordHash: '', // No password for OAuth users
          isEmailVerified: true, // OAuth emails are verified
        },
      });
    }

    return this.generateTokens(user.id, user.email);
  }
}
