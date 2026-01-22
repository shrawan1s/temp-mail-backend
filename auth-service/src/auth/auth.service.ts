import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user';
import { TokenService } from '../token';
import { OAuthService } from '../oauth';
import { EmailService } from '../email';
import { AUTH_MESSAGES, LOG_MESSAGES } from '../constants';
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
  IUser,
  IUserDto,
  IUserResponse,
  IUserUpdateRequest,
  IValidateTokenRequest,
  IValidateTokenResponse,
  IVerifyEmailRequest,
  IGetSettingsRequest,
  ISettingsResponse,
  IUpdateSettingsRequest,
  IChangePasswordRequest,
  IChangePasswordResponse,
  IDeleteAccountRequest,
  IDeleteAccountResponse,
} from '../interfaces';

/**
 * Service for authentication business logic.
 * Handles user registration, login, OAuth, email verification, and password reset.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private oauthService: OAuthService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /** Convert Prisma User model to DTO for response */
  private toUserDto(user: IUser): IUserDto {
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

  /**
   * Register a new user and send verification email.
   */
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

      this.logger.log(LOG_MESSAGES.USER_REGISTERED(user.email));

      return {
        success: true,
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        user_id: user.id,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.REGISTRATION_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.REGISTER_FAILED,
      };
    }
  }

  /**
   * Verify user email with 6-digit code.
   * On success: marks email verified, returns tokens and user data.
   */
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

      this.logger.log(LOG_MESSAGES.EMAIL_VERIFIED(result.user.email));

      return {
        success: true,
        message: AUTH_MESSAGES.VERIFY_SUCCESS,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(result.user),
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.VERIFY_EMAIL_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.VERIFY_FAILED,
      };
    }
  }

  /**
   * Resend email verification code.
   * Returns success even if email not found (security: don't reveal user existence).
   */
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

      this.logger.log(LOG_MESSAGES.VERIFICATION_CODE_RESENT(result.user.email));

      return {
        success: true,
        message: AUTH_MESSAGES.RESEND_CODE_SUCCESS,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.RESEND_VERIFICATION_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.RESEND_CODE_FAILED,
      };
    }
  }

  /**
   * Authenticate user with email and password.
   * Requires verified email. Returns tokens and user data on success.
   */
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

      this.logger.log(LOG_MESSAGES.USER_LOGGED_IN(user.email));

      return {
        success: true,
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.LOGIN_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGIN_FAILED,
      };
    }
  }

  /**
   * End user session by blacklisting the access token.
   */
  async logout(data: ILogoutRequest): Promise<ILogoutResponse> {
    try {
      await this.tokenService.revokeAccessToken(data.access_token);

      this.logger.log(LOG_MESSAGES.USER_LOGGED_OUT(data.user_id));

      return {
        success: true,
        message: AUTH_MESSAGES.LOGOUT_SUCCESS,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.LOGOUT_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGOUT_FAILED,
      };
    }
  }

  /**
   * Exchange refresh token for new access/refresh token pair.
   * Implements token rotation: old refresh token is invalidated.
   */
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
      this.logger.error(LOG_MESSAGES.TOKEN_REFRESH_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.TOKEN_REFRESH_FAILED,
      };
    }
  }

  /**
   * Validate access token and return user info if valid.
   * Used by Gateway to authenticate incoming requests.
   */
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
    } catch {
      return { valid: false };
    }
  }

  /**
   * Get user profile by ID.
   */
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
      this.logger.error(LOG_MESSAGES.GET_USER_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.USER_GET_FAILED,
      };
    }
  }

  /**
   * Update user profile (name and/or avatar).
   */
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
      this.logger.error(LOG_MESSAGES.UPDATE_USER_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.USER_UPDATE_FAILED,
      };
    }
  }

  /**
   * Authenticate via OAuth (Google or GitHub).
   * Creates account if first login, links provider if email exists.
   * OAuth users are auto-verified.
   */
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

      let user =
        data.provider === 'google'
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

      this.logger.log(LOG_MESSAGES.OAUTH_LOGIN_SUCCESS(user.email, data.provider));

      return {
        success: true,
        message: AUTH_MESSAGES.OAUTH_SUCCESS,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: this.toUserDto(user),
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.OAUTH_LOGIN_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.OAUTH_LOGIN_FAILED,
      };
    }
  }

  /**
   * Request password reset email.
   * Returns success even if email not found (security: don't reveal user existence).
   */
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

      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetLink);

      this.logger.log(LOG_MESSAGES.PASSWORD_RESET_REQUESTED(user.email));

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_HINT,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.PASSWORD_RESET_REQUEST_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_REQUEST_FAILED,
      };
    }
  }

  /**
   * Set new password using reset token.
   * Invalidates all existing sessions after password change.
   */
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

      this.logger.log(LOG_MESSAGES.PASSWORD_RESET_SUCCESS(userId));

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.PASSWORD_RESET_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_FAILED,
      };
    }
  }

  /**
   * Get user settings. Creates default settings if none exist.
   */
  async getSettings(data: IGetSettingsRequest): Promise<ISettingsResponse> {
    try {
      const settings = await this.userService.getOrCreateSettings(data.user_id);

      return {
        success: true,
        message: AUTH_MESSAGES.SETTINGS_FETCH_SUCCESS,
        settings: {
          dark_mode: settings.darkMode,
          auto_refresh: settings.autoRefresh,
          email_expiry: settings.emailExpiry,
          notifications: settings.notifications,
          blocked_senders: settings.blockedSenders,
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.GET_SETTINGS_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.SETTINGS_FETCH_FAILED,
      };
    }
  }

  /**
   * Update user settings.
   */
  async updateSettings(data: IUpdateSettingsRequest): Promise<ISettingsResponse> {
    try {
      const updateData: {
        darkMode?: boolean;
        autoRefresh?: boolean;
        emailExpiry?: string;
        notifications?: boolean;
        blockedSenders?: string[];
      } = {};

      if (data.dark_mode !== undefined) updateData.darkMode = data.dark_mode;
      if (data.auto_refresh !== undefined) updateData.autoRefresh = data.auto_refresh;
      if (data.email_expiry !== undefined) updateData.emailExpiry = data.email_expiry;
      if (data.notifications !== undefined) updateData.notifications = data.notifications;
      if (data.blocked_senders !== undefined) updateData.blockedSenders = data.blocked_senders;

      const settings = await this.userService.updateSettings(data.user_id, updateData);

      return {
        success: true,
        message: AUTH_MESSAGES.SETTINGS_UPDATE_SUCCESS,
        settings: {
          dark_mode: settings.darkMode,
          auto_refresh: settings.autoRefresh,
          email_expiry: settings.emailExpiry,
          notifications: settings.notifications,
          blocked_senders: settings.blockedSenders,
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.UPDATE_SETTINGS_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.SETTINGS_UPDATE_FAILED,
      };
    }
  }

  /**
   * Change password for users with password auth.
   */
  async changePassword(data: IChangePasswordRequest): Promise<IChangePasswordResponse> {
    try {
      const user = await this.userService.findById(data.user_id);
      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
        };
      }

      // Check if user has a password (not OAuth-only)
      if (!user.password) {
        return {
          success: false,
          message: AUTH_MESSAGES.NO_PASSWORD_SET,
        };
      }

      // Validate current password
      const isValid = await this.userService.validatePassword(user, data.current_password);
      if (!isValid) {
        return {
          success: false,
          message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT,
        };
      }

      // Update password
      await this.userService.updatePassword(data.user_id, data.new_password);

      // Revoke all tokens to force re-login
      await this.tokenService.revokeAllUserTokens(data.user_id);

      this.logger.log(LOG_MESSAGES.PASSWORD_CHANGED(data.user_id));

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.CHANGE_PASSWORD_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_CHANGE_FAILED,
      };
    }
  }

  /**
   * Delete user account. Requires password for users with password auth.
   */
  async deleteAccount(data: IDeleteAccountRequest): Promise<IDeleteAccountResponse> {
    try {
      const user = await this.userService.findById(data.user_id);
      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
        };
      }

      // If user has a password, require it for deletion
      if (user.password) {
        if (!data.password) {
          return {
            success: false,
            message: AUTH_MESSAGES.PASSWORD_REQUIRED_FOR_DELETE,
          };
        }

        const isValid = await this.userService.validatePassword(user, data.password);
        if (!isValid) {
          return {
            success: false,
            message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT,
          };
        }
      }

      // Delete the user (cascade will handle related records)
      await this.userService.delete(data.user_id);

      this.logger.log(LOG_MESSAGES.ACCOUNT_DELETED(data.user_id));

      return {
        success: true,
        message: AUTH_MESSAGES.ACCOUNT_DELETED,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.DELETE_ACCOUNT_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.ACCOUNT_DELETE_FAILED,
      };
    }
  }
}
