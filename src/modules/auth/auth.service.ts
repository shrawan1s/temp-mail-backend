import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user';
import { TokenService } from './token';
import { OAuthService } from './oauth';
import { EmailService } from '../email';
import { AUTH_MESSAGES, LOG_MESSAGES } from '../../common/constants';
import { User } from '@prisma/client';
import {
  IApiResponse,
  IAuthData,
  ISettingsData,
  IUserDto,
} from '../../common/types';
import { OAuthProvider } from 'src/common';

/**
 * Authentication Service
 *
 * Core service that orchestrates all authentication operations including
 * user registration, login, OAuth, password management, and settings.
 * Acts as a facade over UserService, TokenService, OAuthService, and EmailService.
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

  /**
   * Converts a Prisma User entity to a client-safe UserDto.
   * @param user - The Prisma User entity
   * @returns User DTO with safe fields for client consumption
   */
  private toUserDto(user: User): IUserDto {
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
   * Registers a new user account with email/password.
   * Sends a verification email with a 6-digit code.
   * @param email - User's email address
   * @param password - User's password (will be hashed)
   * @param name - User's display name
   * @returns API response with user_id on success
   */
  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<IApiResponse<IAuthData | null>> {
    try {
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_ALREADY_EXISTS,
          data: null,
        };
      }

      const user = await this.userService.create({ email, password, name });

      if (user.verificationCode) {
        await this.emailService.sendVerificationCode(
          user.email,
          user.name,
          user.verificationCode,
        );
      }

      this.logger.log(LOG_MESSAGES.USER_REGISTERED(email));

      return {
        success: true,
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        data: { user_id: user.id },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.REGISTRATION_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.REGISTER_FAILED,
        data: null,
      };
    }
  }

  /**
   * Verifies a user's email using the 6-digit verification code.
   * On success, generates and returns auth tokens.
   * @param userId - The user's ID
   * @param code - 6-digit verification code from email
   * @returns API response with access/refresh tokens and user data on success
   */
  async verifyEmail(
    userId: string,
    code: string,
  ): Promise<IApiResponse<IAuthData | null>> {
    try {
      const result = await this.userService.verifyEmail(userId, code);

      if (!result.success || !result.user) {
        return {
          success: false,
          message: AUTH_MESSAGES.VERIFY_INVALID_CODE,
          data: null,
        };
      }

      const tokens = await this.tokenService.generateTokenPair(
        result.user.id,
        result.user.email,
      );

      this.logger.log(LOG_MESSAGES.EMAIL_VERIFIED(result.user.email));

      return {
        success: true,
        message: AUTH_MESSAGES.VERIFY_SUCCESS,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          user: this.toUserDto(result.user),
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.VERIFY_EMAIL_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.VERIFY_FAILED,
        data: null,
      };
    }
  }

  /**
   * Resends the email verification code to a user.
   * Generates a new code and sends it via email.
   * @param email - User's email address
   * @returns API response (always returns success hint for security)
   */
  async resendVerificationCode(email: string): Promise<IApiResponse<null>> {
    try {
      const result = await this.userService.resendVerificationCode(email);

      if (!result.success || !result.user || !result.code) {
        return {
          success: true,
          message: AUTH_MESSAGES.RESEND_CODE_HINT,
          data: null,
        };
      }

      await this.emailService.sendVerificationCode(
        result.user.email,
        result.user.name,
        result.code,
      );

      return {
        success: true,
        message: AUTH_MESSAGES.RESEND_CODE_SUCCESS,
        data: null,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.RESEND_VERIFICATION_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.RESEND_CODE_FAILED,
        data: null,
      };
    }
  }

  /**
   * Authenticates a user with email and password.
   * Generates access and refresh tokens on successful login.
   * @param email - User's email address
   * @param password - User's password
   * @returns API response with tokens and user data on success
   */
  async login(
    email: string,
    password: string,
  ): Promise<IApiResponse<IAuthData | null>> {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
          data: null,
        };
      }

      if (!user.isVerified) {
        return {
          success: false,
          message: AUTH_MESSAGES.EMAIL_NOT_VERIFIED,
          data: null,
        };
      }

      const isValid = await this.userService.validatePassword(user, password);
      if (!isValid) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_CREDENTIALS,
          data: null,
        };
      }

      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
      );

      this.logger.log(LOG_MESSAGES.USER_LOGGED_IN(email));

      return {
        success: true,
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          user: this.toUserDto(user),
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.LOGIN_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGIN_FAILED,
        data: null,
      };
    }
  }

  /**
   * Logs out a user by blacklisting their access token.
   * @param accessToken - The JWT access token to revoke
   * @returns API response indicating logout status
   */
  async logout(accessToken: string): Promise<IApiResponse<null>> {
    try {
      await this.tokenService.revokeAccessToken(accessToken);
      return {
        success: true,
        message: AUTH_MESSAGES.LOGOUT_SUCCESS,
        data: null,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.LOGOUT_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.LOGOUT_FAILED,
        data: null,
      };
    }
  }

  /**
   * Refreshes the auth tokens using a valid refresh token.
   * Implements token rotation - old refresh token is invalidated.
   * @param refreshToken - The refresh token
   * @returns API response with new tokens on success
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<IApiResponse<IAuthData | null>> {
    try {
      const tokens = await this.tokenService.refreshTokens(refreshToken);
      if (!tokens) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_REFRESH_TOKEN,
          data: null,
        };
      }

      return {
        success: true,
        message: AUTH_MESSAGES.TOKEN_REFRESHED,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.TOKEN_REFRESH_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.TOKEN_REFRESH_FAILED,
        data: null,
      };
    }
  }

  /**
   * Handles OAuth login flow for Google and GitHub.
   * Creates new user or links OAuth provider to existing account.
   * @param provider - OAuth provider (GOOGLE or GITHUB)
   * @param code - Authorization code from OAuth provider
   * @param redirectUri - The redirect URI used in the OAuth flow
   * @returns API response with tokens and user data on success
   */
  async oAuthLogin(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
  ): Promise<IApiResponse<IAuthData | null>> {
    try {
      const oauthUser =
        provider === OAuthProvider.GOOGLE
          ? await this.oauthService.handleGoogleLogin(code, redirectUri)
          : await this.oauthService.handleGithubLogin(code, redirectUri);

      if (!oauthUser) {
        return {
          success: false,
          message: AUTH_MESSAGES.OAUTH_FAILED,
          data: null,
        };
      }

      let user =
        provider === OAuthProvider.GOOGLE
          ? await this.userService.findByGoogleId(oauthUser.id)
          : await this.userService.findByGithubId(oauthUser.id);

      if (!user) {
        user = await this.userService.findByEmail(oauthUser.email);
        if (user) {
          user =
            provider === OAuthProvider.GOOGLE
              ? await this.userService.linkGoogleAccount(user.id, oauthUser.id)
              : await this.userService.linkGithubAccount(user.id, oauthUser.id);
        } else {
          user = await this.userService.create({
            email: oauthUser.email,
            name: oauthUser.name,
            avatarUrl: oauthUser.avatarUrl,
            googleId:
              provider === OAuthProvider.GOOGLE ? oauthUser.id : undefined,
            githubId:
              provider === OAuthProvider.GITHUB ? oauthUser.id : undefined,
          });
        }
      }

      const tokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
      );

      this.logger.log(LOG_MESSAGES.OAUTH_LOGIN(user.email, provider));

      return {
        success: true,
        message: AUTH_MESSAGES.OAUTH_SUCCESS,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          user: this.toUserDto(user),
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.OAUTH_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.OAUTH_LOGIN_FAILED,
        data: null,
      };
    }
  }

  /**
   * Retrieves a user's profile by their ID.
   * @param userId - The user's ID
   * @returns API response with user data on success
   */
  async getUser(userId: string): Promise<IApiResponse<IAuthData | null>> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
          data: null,
        };
      }

      return {
        success: true,
        message: AUTH_MESSAGES.USER_FOUND,
        data: { user: this.toUserDto(user) },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.GET_USER_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.USER_GET_FAILED,
        data: null,
      };
    }
  }

  /**
   * Updates a user's profile information.
   * @param userId - The user's ID
   * @param name - New display name (optional)
   * @param avatarUrl - New avatar URL (optional)
   * @returns API response with updated user data on success
   */
  async updateUser(
    userId: string,
    name?: string,
    avatarUrl?: string,
  ): Promise<IApiResponse<IAuthData | null>> {
    try {
      const updateData: { name?: string; avatarUrl?: string } = {};
      if (name) updateData.name = name;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;

      const user = await this.userService.update(userId, updateData);

      return {
        success: true,
        message: AUTH_MESSAGES.USER_UPDATED,
        data: { user: this.toUserDto(user) },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.UPDATE_USER_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.USER_UPDATE_FAILED,
        data: null,
      };
    }
  }

  /**
   * Initiates password reset flow by sending a reset email.
   * Always returns success hint to prevent email enumeration.
   * @param email - User's email address
   * @returns API response (always returns generic success for security)
   */
  async requestPasswordReset(email: string): Promise<IApiResponse<null>> {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        return {
          success: true,
          message: AUTH_MESSAGES.PASSWORD_RESET_HINT,
          data: null,
        };
      }

      const token = await this.tokenService.generatePasswordResetToken(user.id);
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      const resetLink = `${frontendUrl}/reset-password/${token}`;
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetLink,
      );

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_HINT,
        data: null,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.PASSWORD_RESET_REQUEST_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_REQUEST_FAILED,
        data: null,
      };
    }
  }

  /**
   * Completes password reset using the reset token.
   * Revokes all existing sessions after password change.
   * @param token - Password reset token from email
   * @param newPassword - New password to set
   * @returns API response indicating success or failure
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<IApiResponse<null>> {
    try {
      const userId = await this.tokenService.validatePasswordResetToken(token);
      if (!userId) {
        return {
          success: false,
          message: AUTH_MESSAGES.INVALID_RESET_TOKEN,
          data: null,
        };
      }

      await this.userService.updatePassword(userId, newPassword);
      await this.tokenService.markPasswordResetTokenUsed(token);
      await this.tokenService.revokeAllUserTokens(userId);

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
        data: null,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.PASSWORD_RESET_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_RESET_FAILED,
        data: null,
      };
    }
  }

  /**
   * Retrieves user settings (theme, notifications, etc.).
   * Creates default settings if none exist.
   * @param userId - The user's ID
   * @returns API response with user settings
   */
  async getSettings(
    userId: string,
  ): Promise<IApiResponse<ISettingsData | null>> {
    try {
      const settings = await this.userService.getOrCreateSettings(userId);

      return {
        success: true,
        message: AUTH_MESSAGES.SETTINGS_FETCH_SUCCESS,
        data: {
          settings: {
            dark_mode: settings.darkMode,
            auto_refresh: settings.autoRefresh,
            email_expiry: settings.emailExpiry,
            notifications: settings.notifications,
            blocked_senders: settings.blockedSenders,
          },
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.GET_SETTINGS_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.SETTINGS_FETCH_FAILED,
        data: null,
      };
    }
  }

  /**
   * Updates user settings (theme, notifications, blocked senders, etc.).
   * @param userId - The user's ID
   * @param data - Settings to update
   * @returns API response with updated settings
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
  ): Promise<IApiResponse<ISettingsData | null>> {
    try {
      const settings = await this.userService.updateSettings(userId, data);

      return {
        success: true,
        message: AUTH_MESSAGES.SETTINGS_UPDATE_SUCCESS,
        data: {
          settings: {
            dark_mode: settings.darkMode,
            auto_refresh: settings.autoRefresh,
            email_expiry: settings.emailExpiry,
            notifications: settings.notifications,
            blocked_senders: settings.blockedSenders,
          },
        },
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.UPDATE_SETTINGS_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.SETTINGS_UPDATE_FAILED,
        data: null,
      };
    }
  }

  /**
   * Changes user's password (requires current password verification).
   * Revokes all existing sessions after password change.
   * @param userId - The user's ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns API response indicating success or failure
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<IApiResponse<null>> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
          data: null,
        };
      }

      if (!user.password) {
        return {
          success: false,
          message: AUTH_MESSAGES.NO_PASSWORD_SET,
          data: null,
        };
      }

      const isValid = await this.userService.validatePassword(
        user,
        currentPassword,
      );
      if (!isValid) {
        return {
          success: false,
          message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT,
          data: null,
        };
      }

      await this.userService.updatePassword(userId, newPassword);
      await this.tokenService.revokeAllUserTokens(userId);

      return {
        success: true,
        message: AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS,
        data: null,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.CHANGE_PASSWORD_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.PASSWORD_CHANGE_FAILED,
        data: null,
      };
    }
  }

  /**
   * Permanently deletes a user account.
   * Requires password verification for accounts with passwords.
   * OAuth-only accounts can be deleted without password.
   * @param userId - The user's ID
   * @param password - Password for verification (required for password-based accounts)
   * @returns API response indicating success or failure
   */
  async deleteAccount(
    userId: string,
    password?: string,
  ): Promise<IApiResponse<null>> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        return {
          success: false,
          message: AUTH_MESSAGES.USER_NOT_FOUND,
          data: null,
        };
      }

      if (user.password) {
        if (!password) {
          return {
            success: false,
            message: AUTH_MESSAGES.PASSWORD_REQUIRED_FOR_DELETE,
            data: null,
          };
        }

        const isValid = await this.userService.validatePassword(user, password);
        if (!isValid) {
          return {
            success: false,
            message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT,
            data: null,
          };
        }
      }

      await this.userService.delete(userId);

      return {
        success: true,
        message: AUTH_MESSAGES.ACCOUNT_DELETED,
        data: null,
      };
    } catch (error) {
      this.logger.error(LOG_MESSAGES.DELETE_ACCOUNT_ERROR, error);
      return {
        success: false,
        message: AUTH_MESSAGES.ACCOUNT_DELETE_FAILED,
        data: null,
      };
    }
  }
}
