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

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        googleId: data.googleId,
        githubId: data.githubId,
        avatarUrl: data.avatarUrl,
        isVerified: !!data.googleId || !!data.githubId, // OAuth users are auto-verified
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
}
