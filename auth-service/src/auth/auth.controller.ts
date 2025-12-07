import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../user';
import { TokenService } from '../token';
import { OAuthService } from '../oauth';
import { EmailService } from '../email';
import {
  IAuthResponse,
  IGetUserRequest,
  ILoginRequest,
  ILogoutRequest,
  ILogoutResponse,
  IOAuthLoginRequest,
  IPasswordResetRequest,
  IPasswordResetResponse,
  IRefreshTokenRequest,
  IRegisterRequest,
  IRegisterResponse,
  IResendVerificationRequest,
  IResendVerificationResponse,
  IResetPasswordConfirmRequest,
  IResetPasswordConfirmResponse,
  IUserDto,
  IUserResponse,
  IUserUpdateRequest,
  IValidateTokenRequest,
  IValidateTokenResponse,
  IVerifyEmailRequest,
} from '../interfaces';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private oauthService: OAuthService,
    private emailService: EmailService,
  ) {}

  private toUserDto(user: any): IUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl || '',
      plan: user.plan,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  @GrpcMethod('AuthService', 'Register')
  async register(data: IRegisterRequest): Promise<IRegisterResponse> {
    try {
      const existingUser = await this.userService.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      const user = await this.userService.create({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Send verification email
      if (user.verificationCode) {
        await this.emailService.sendVerificationCode(user.email, user.name, user.verificationCode);
      }

      this.logger.log(`User registered: ${user.email}, verification code sent`);

      return {
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        user_id: user.id,
      };
    } catch (error) {
      this.logger.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'VerifyEmail')
  async verifyEmail(data: IVerifyEmailRequest): Promise<IAuthResponse> {
    try {
      const result = await this.userService.verifyEmail(data.user_id, data.code);
      
      if (!result.success || !result.user) {
        return {
          success: false,
          message: 'Invalid or expired verification code',
        };
      }

      const tokens = await this.tokenService.generateTokenPair(result.user.id, result.user.email);

      this.logger.log(`Email verified: ${result.user.email}`);

      return {
        success: true,
        message: 'Email verified successfully',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(result.user),
      };
    } catch (error) {
      this.logger.error('Verify email error:', error);
      return {
        success: false,
        message: 'Email verification failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'ResendVerificationCode')
  async resendVerificationCode(data: IResendVerificationRequest): Promise<IResendVerificationResponse> {
    try {
      const result = await this.userService.resendVerificationCode(data.email);
      
      if (!result.success || !result.user || !result.code) {
        return {
          success: true, // Don't reveal whether email exists
          message: 'If the email exists and is not verified, a new code will be sent',
        };
      }

      await this.emailService.sendVerificationCode(result.user.email, result.user.name, result.code);

      this.logger.log(`Verification code resent to: ${result.user.email}`);

      return {
        success: true,
        message: 'Verification code sent',
      };
    } catch (error) {
      this.logger.error('Resend verification error:', error);
      return {
        success: false,
        message: 'Failed to resend verification code',
      };
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: ILoginRequest): Promise<IAuthResponse> {
    try {
      const user = await this.userService.findByEmail(data.email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if email is verified
      if (!user.isVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
        };
      }

      const isValid = await this.userService.validatePassword(user, data.password);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

      this.logger.log(`User logged in: ${user.email}`);

      return {
        success: true,
        message: 'Login successful',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: ILogoutRequest): Promise<ILogoutResponse> {
    try {
      await this.tokenService.revokeAccessToken(data.access_token);

      this.logger.log(`User logged out: ${data.user_id}`);

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      this.logger.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: IRefreshTokenRequest): Promise<IAuthResponse> {
    try {
      const tokens = await this.tokenService.refreshTokens(data.refresh_token);
      if (!tokens) {
        return {
          success: false,
          message: 'Invalid or expired refresh token',
        };
      }

      return {
        success: true,
        message: 'Token refreshed',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token refresh failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: IValidateTokenRequest): Promise<IValidateTokenResponse> {
    try {
      const payload = await this.tokenService.validateAccessToken(data.access_token);
      if (!payload) {
        return { valid: false };
      }

      return {
        valid: true,
        user_id: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser(data: IGetUserRequest): Promise<IUserResponse> {
    try {
      const user = await this.userService.findById(data.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'User found',
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Get user error:', error);
      return {
        success: false,
        message: 'Failed to get user',
      };
    }
  }

  @GrpcMethod('AuthService', 'UpdateUser')
  async updateUser(data: IUserUpdateRequest): Promise<IUserResponse> {
    try {
      const updateData: { name?: string; avatarUrl?: string } = {};
      if (data.name) updateData.name = data.name;
      if (data.avatar_url) updateData.avatarUrl = data.avatar_url;

      const user = await this.userService.update(data.user_id, updateData);

      return {
        success: true,
        message: 'User updated',
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Update user error:', error);
      return {
        success: false,
        message: 'Failed to update user',
      };
    }
  }

  @GrpcMethod('AuthService', 'OAuthLogin')
  async oAuthLogin(data: IOAuthLoginRequest): Promise<IAuthResponse> {
    try {
      let oauthUser: { id: string; email: string; name: string; avatarUrl?: string } | null = null;

      if (data.provider === 'google') {
        oauthUser = await this.oauthService.handleGoogleLogin(data.code, data.redirect_uri);
      } else if (data.provider === 'github') {
        oauthUser = await this.oauthService.handleGithubLogin(data.code, data.redirect_uri);
      } else {
        return {
          success: false,
          message: 'Unsupported OAuth provider',
        };
      }

      if (!oauthUser) {
        return {
          success: false,
          message: 'OAuth authentication failed',
        };
      }

      let user = data.provider === 'google'
        ? await this.userService.findByGoogleId(oauthUser.id)
        : await this.userService.findByGithubId(oauthUser.id);

      if (!user) {
        user = await this.userService.findByEmail(oauthUser.email);
        if (user) {
          if (data.provider === 'google') {
            user = await this.userService.linkGoogleAccount(user.id, oauthUser.id);
          } else {
            user = await this.userService.linkGithubAccount(user.id, oauthUser.id);
          }
        } else {
          user = await this.userService.create({
            email: oauthUser.email,
            name: oauthUser.name,
            avatarUrl: oauthUser.avatarUrl,
            googleId: data.provider === 'google' ? oauthUser.id : undefined,
            githubId: data.provider === 'github' ? oauthUser.id : undefined,
          });
        }
      }

      const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

      this.logger.log(`OAuth login successful: ${user.email} via ${data.provider}`);

      return {
        success: true,
        message: 'OAuth login successful',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('OAuth login error:', error);
      return {
        success: false,
        message: 'OAuth login failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'RequestPasswordReset')
  async requestPasswordReset(data: IPasswordResetRequest): Promise<IPasswordResetResponse> {
    try {
      const user = await this.userService.findByEmail(data.email);

      if (!user) {
        return {
          success: true,
          message: 'If the email exists, a password reset link will be sent',
        };
      }

      const token = await this.tokenService.generatePasswordResetToken(user.id);
      
      // TODO: Get frontend URL from config
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetLink);

      this.logger.log(`Password reset requested for: ${user.email}`);

      return {
        success: true,
        message: 'If the email exists, a password reset link will be sent',
      };
    } catch (error) {
      this.logger.error('Password reset request error:', error);
      return {
        success: false,
        message: 'Password reset request failed',
      };
    }
  }

  @GrpcMethod('AuthService', 'ResetPassword')
  async resetPassword(data: IResetPasswordConfirmRequest): Promise<IResetPasswordConfirmResponse> {
    try {
      const userId = await this.tokenService.validatePasswordResetToken(data.token);
      if (!userId) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      await this.userService.updatePassword(userId, data.new_password);
      await this.tokenService.markPasswordResetTokenUsed(data.token);
      await this.tokenService.revokeAllUserTokens(userId);

      this.logger.log(`Password reset successful for user: ${userId}`);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      this.logger.error('Password reset error:', error);
      return {
        success: false,
        message: 'Password reset failed',
      };
    }
  }
}
