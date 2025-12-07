import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { githubId } });
  }

  async create(data: {
    email: string;
    password?: string;
    name: string;
    googleId?: string;
    githubId?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    // Generate 6-digit verification code
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        googleId: data.googleId,
        githubId: data.githubId,
        avatarUrl: data.avatarUrl,
        isVerified: !!data.googleId || !!data.githubId, // OAuth users are auto-verified
        verificationCode: (data.googleId || data.githubId) ? null : verificationCode,
        verificationCodeExpiry: (data.googleId || data.githubId) ? null : verificationCodeExpiry,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; avatarUrl?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId, isVerified: true },
    });
  }

  async linkGithubAccount(userId: string, githubId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { githubId, isVerified: true },
    });
  }

  async updatePlan(userId: string, plan: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
  }

  // Verification methods
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyEmail(userId: string, code: string): Promise<{ success: boolean; user?: User }> {
    const user = await this.findById(userId);
    if (!user) {
      return { success: false };
    }

    if (user.isVerified) {
      return { success: true, user };
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return { success: false };
    }

    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      return { success: false };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    return { success: true, user: updatedUser };
  }

  async resendVerificationCode(email: string): Promise<{ success: boolean; user?: User; code?: string }> {
    const user = await this.findByEmail(email);
    if (!user || user.isVerified) {
      return { success: false };
    }

    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
      },
    });

    return { success: true, user: updatedUser, code: verificationCode };
  }
}
