import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Service for managing user accounts.
 * Handles user CRUD operations, password management, email verification, and OAuth account linking.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  /** Find a user by their unique ID */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Find a user by their email address */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Find a user by their linked Google account ID */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  /** Find a user by their linked GitHub account ID */
  async findByGithubId(githubId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { githubId } });
  }

  /**
   * Create a new user account.
   * Generates a 6-digit verification code for email verification.
   * OAuth users (Google/GitHub) are auto-verified.
   */
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

    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        googleId: data.googleId,
        githubId: data.githubId,
        avatarUrl: data.avatarUrl,
        isVerified: !!data.googleId || !!data.githubId,
        verificationCode: (data.googleId || data.githubId) ? null : verificationCode,
        verificationCodeExpiry: (data.googleId || data.githubId) ? null : verificationCodeExpiry,
      },
    });
  }

  /** Update user profile (name, avatar) */
  async update(id: string, data: { name?: string; avatarUrl?: string }): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /** Update user password (hashes automatically) */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /** Validate password against stored hash */
  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  /** Link a Google account to an existing user */
  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId, isVerified: true },
    });
  }

  /** Link a GitHub account to an existing user */
  async linkGithubAccount(userId: string, githubId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { githubId, isVerified: true },
    });
  }

  /** Update user subscription plan */
  async updatePlan(userId: string, plan: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
  }

  /** Generate a random 6-digit verification code */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verify user email with the provided code.
   * Clears verification code after successful verification to prevent reuse.
   */
  async verifyEmail(userId: string, code: string): Promise<{ success: boolean; user?: User }> {
    const user = await this.findById(userId);
    if (!user) return { success: false };

    // Already verified
    if (user.isVerified) return { success: true, user };

    // Validate code
    if (!user.verificationCode || user.verificationCode !== code) {
      return { success: false };
    }

    // Check expiry
    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      return { success: false };
    }

    // Mark as verified and clear code
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

  /**
   * Generate and store a new verification code for resending.
   * Returns the new code to be sent via email.
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; user?: User; code?: string }> {
    const user = await this.findByEmail(email);
    if (!user || user.isVerified) return { success: false };

    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationCodeExpiry },
    });

    return { success: true, user: updatedUser, code: verificationCode };
  }
}
