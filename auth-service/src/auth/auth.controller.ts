import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../user';
import { TokenService } from '../token';
import { OAuthService } from '../oauth';
import { IAuthResponse, IGetUserRequest, ILoginRequest, ILogoutRequest, ILogoutResponse, IOAuthLoginRequest, IPasswordResetRequest, IPasswordResetResponse, IRefreshTokenRequest, IRegisterRequest, IResetPasswordConfirmRequest, IResetPasswordConfirmResponse, IUserDto, IUserResponse, IUserUpdateRequest, IValidateTokenRequest, IValidateTokenResponse } from '../interfaces';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private oauthService: OAuthService,
  ) {}

  private toUserDto(user: any): IUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      plan: user.plan,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  @GrpcMethod('AuthService', 'Register')
  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    try {
      // Check if user exists
      const existingUser = await this.userService.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Create user
      const user = await this.userService.create({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Generate tokens
      const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

      this.logger.log(`User registered: ${user.email}`);

      return {
        success: true,
        message: 'Registration successful',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
      await this.tokenService.revokeAccessToken(data.accessToken);

      this.logger.log(`User logged out: ${data.userId}`);

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
      const tokens = await this.tokenService.refreshTokens(data.refreshToken);
      if (!tokens) {
        return {
          success: false,
          message: 'Invalid or expired refresh token',
        };
      }

      return {
        success: true,
        message: 'Token refreshed',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
      const payload = await this.tokenService.validateAccessToken(data.accessToken);
      if (!payload) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser(data: IGetUserRequest): Promise<IUserResponse> {
    try {
      const user = await this.userService.findById(data.userId);
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
      if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;

      const user = await this.userService.update(data.userId, updateData);

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
        oauthUser = await this.oauthService.handleGoogleLogin(data.code, data.redirectUri);
      } else if (data.provider === 'github') {
        oauthUser = await this.oauthService.handleGithubLogin(data.code, data.redirectUri);
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

      // Find or create user
      let user = data.provider === 'google'
        ? await this.userService.findByGoogleId(oauthUser.id)
        : await this.userService.findByGithubId(oauthUser.id);

      if (!user) {
        // Check if email exists
        user = await this.userService.findByEmail(oauthUser.email);
        if (user) {
          // Link OAuth account to existing user
          if (data.provider === 'google') {
            user = await this.userService.linkGoogleAccount(user.id, oauthUser.id);
          } else {
            user = await this.userService.linkGithubAccount(user.id, oauthUser.id);
          }
        } else {
          // Create new user
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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
      
      // Always return success to prevent email enumeration
      if (!user) {
        return {
          success: true,
          message: 'If the email exists, a password reset link will be sent',
        };
      }

      const token = await this.tokenService.generatePasswordResetToken(user.id);

      // TODO: Send email with reset link
      this.logger.log(`Password reset requested for: ${user.email}, token: ${token}`);

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

      await this.userService.updatePassword(userId, data.newPassword);
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
