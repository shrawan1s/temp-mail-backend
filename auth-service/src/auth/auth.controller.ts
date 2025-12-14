import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../user';
import { TokenService } from '../token';
import { OAuthService } from '../oauth';
import { EmailService } from '../email';
import { AUTH_MESSAGES } from '../constants';
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
          message: AUTH_MESSAGES.USER_ALREADY_EXISTS,
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
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        user_id: user.id,
      };
    } catch (error) {
      this.logger.error('Registration error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.REGISTER_FAILED,
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
          message: AUTH_MESSAGES.VERIFY_INVALID_CODE,
        };
      }

      const tokens = await this.tokenService.generateTokenPair(result.user.id, result.user.email);

      this.logger.log(`Email verified: ${result.user.email}`);

      return {
        success: true,
        message: AUTH_MESSAGES.VERIFY_SUCCESS,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(result.user),
      };
    } catch (error) {
      this.logger.error('Verify email error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.VERIFY_FAILED,
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
          message: AUTH_MESSAGES.RESEND_CODE_HINT,
        };
      }

      await this.emailService.sendVerificationCode(result.user.email, result.user.name, result.code);

      this.logger.log(`Verification code resent to: ${result.user.email}`);

      return {
        success: true,
        message: AUTH_MESSAGES.RESEND_CODE_SUCCESS,
      };
    } catch (error) {
      this.logger.error('Resend verification error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.RESEND_CODE_FAILED,
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
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Check if email is verified
      if (!user.isVerified) {
        return {
          success: false,
          message: AUTH_MESSAGES.EMAIL_NOT_VERIFIED,
        };
      }

      const isValid = await this.userService.validatePassword(user, data.password);
      if (!isValid) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

      this.logger.log(`User logged in: ${user.email}`);

      return {
        success: true,
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGIN_FAILED,
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
        message: AUTH_MESSAGES.LOGOUT_SUCCESS,
      };
    } catch (error) {
      this.logger.error('Logout error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGOUT_FAILED,
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
          message: AUTH_MESSAGES.INVALID_REFRESH_TOKEN,
        };
      }

      return {
        success: true,
        message: AUTH_MESSAGES.TOKEN_REFRESHED,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.TOKEN_REFRESH_FAILED,
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
          message: AUTH_MESSAGES.USER_NOT_FOUND,
        };
      }

      return {
        success: true,
        message: AUTH_MESSAGES.USER_FOUND,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Get user error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.USER_GET_FAILED,
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
        message: AUTH_MESSAGES.USER_UPDATED,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('Update user error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.USER_UPDATE_FAILED,
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
          message: AUTH_MESSAGES.OAUTH_UNSUPPORTED_PROVIDER,
        };
      }

      if (!oauthUser) {
        return {
          success: false,
          message: AUTH_MESSAGES.OAUTH_FAILED,
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
        message: AUTH_MESSAGES.OAUTH_SUCCESS,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error('OAuth login error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.OAUTH_LOGIN_FAILED,
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
          message: AUTH_MESSAGES.PASSWORD_RESET_HINT,
        };
      }

      const token = await this.tokenService.generatePasswordResetToken(user.id);
      
      // TODO: Get frontend URL from config
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetLink);

      this.logger.log(`Password reset requested for: ${user.email}`);

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_HINT,
      };
    } catch (error) {
      this.logger.error('Password reset request error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_REQUEST_FAILED,
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
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
        };
      }

      await this.userService.updatePassword(userId, data.new_password);
      await this.tokenService.markPasswordResetTokenUsed(data.token);
      await this.tokenService.revokeAllUserTokens(userId);

      this.logger.log(`Password reset successful for user: ${userId}`);

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      };
    } catch (error) {
      this.logger.error('Password reset error:', error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_FAILED,
      };
    }
  }
}
