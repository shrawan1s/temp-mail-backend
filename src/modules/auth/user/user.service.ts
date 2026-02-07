import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LOG_MESSAGES } from '../../../common/constants';

/**
 * User Service
 *
 * Handles all user-related database operations including CRUD,
 * password management, email verification, OAuth account linking,
 * and user settings management.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Finds a user by their unique ID.
   * @param id - The user's UUID
   * @returns The user entity or null if not found
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Finds a user by their email address.
   * @param email - The user's email
   * @returns The user entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Finds a user by their Google OAuth ID.
   * @param googleId - The Google account ID
   * @returns The user entity or null if not found
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  /**
   * Finds a user by their GitHub OAuth ID.
   * @param githubId - The GitHub account ID
   * @returns The user entity or null if not found
   */
  async findByGithubId(githubId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { githubId } });
  }

  /**
   * Creates a new user account.
   * Generates a 6-digit verification code with 10-minute expiry.
   * OAuth users (Google/GitHub) are automatically verified.
   * @param data - User creation data including email, password, name, and optional OAuth IDs
   * @returns The created user entity
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
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        googleId: data.googleId,
        githubId: data.githubId,
        avatarUrl: data.avatarUrl,
        isVerified: !!data.googleId || !!data.githubId,
        verificationCode:
          data.googleId || data.githubId ? null : verificationCode,
        verificationCodeExpiry:
          data.googleId || data.githubId ? null : verificationCodeExpiry,
      },
    });
  }

  /**
   * Updates a user's profile information.
   * @param id - The user's UUID
   * @param data - Fields to update (name and/or avatarUrl)
   * @returns The updated user entity
   */
  async update(
    id: string,
    data: { name?: string; avatarUrl?: string },
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /**
   * Updates a user's password with bcrypt hashing.
   * @param id - The user's UUID
   * @param newPassword - The new plain-text password (will be hashed)
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Validates a password against the user's stored hash.
   * @param user - The user entity with password hash
   * @param password - The plain-text password to validate
   * @returns True if password matches, false otherwise
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  /**
   * Links a Google account to an existing user.
   * Also marks the user as verified.
   * @param userId - The user's UUID
   * @param googleId - The Google account ID to link
   * @returns The updated user entity
   */
  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId, isVerified: true },
    });
  }

  /**
   * Links a GitHub account to an existing user.
   * Also marks the user as verified.
   * @param userId - The user's UUID
   * @param githubId - The GitHub account ID to link
   * @returns The updated user entity
   */
  async linkGithubAccount(userId: string, githubId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { githubId, isVerified: true },
    });
  }

  /**
   * Updates a user's subscription plan.
   * @param userId - The user's UUID
   * @param plan - The new plan key (e.g., 'free', 'basic', 'business')
   * @returns The updated user entity
   */
  async updatePlan(userId: string, plan: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
  }

  /**
   * Generates a random 6-digit verification code.
   * @returns A 6-digit string code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verifies a user's email using the verification code.
   * Checks code validity and expiration.
   * @param userId - The user's UUID
   * @param code - The 6-digit verification code
   * @returns Object with success status and user entity if successful
   */
  async verifyEmail(
    userId: string,
    code: string,
  ): Promise<{ success: boolean; user?: User }> {
    const user = await this.findById(userId);
    if (!user) return { success: false };

    if (user.isVerified) return { success: true, user };

    if (!user.verificationCode || user.verificationCode !== code) {
      return { success: false };
    }

    if (
      !user.verificationCodeExpiry ||
      user.verificationCodeExpiry < new Date()
    ) {
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

  /**
   * Generates and saves a new verification code for a user.
   * Only works for unverified users.
   * @param email - The user's email address
   * @returns Object with success status, user entity, and new code
   */
  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; user?: User; code?: string }> {
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

  /**
   * Gets user settings, creating default settings if none exist.
   * @param userId - The user's UUID
   * @returns The user settings entity
   */
  async getOrCreateSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Updates user settings (theme, notifications, blocked senders, etc.).
   * Creates settings if they don't exist.
   * @param userId - The user's UUID
   * @param data - Settings fields to update
   * @returns The updated settings entity
   */
  async updateSettings(
    userId: string,
    data: {
      darkMode?: boolean;
      autoRefresh?: boolean;
      emailExpiry?: string;
      notifications?: boolean;
      blockedSenders?: string[];
    },
  ) {
    await this.getOrCreateSettings(userId);

    return this.prisma.userSettings.update({
      where: { userId },
      data,
    });
  }

  /**
   * Permanently deletes a user and all associated data.
   * @param userId - The user's UUID
   */
  async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
    this.logger.log(LOG_MESSAGES.USER_DELETED(userId));
  }
}
