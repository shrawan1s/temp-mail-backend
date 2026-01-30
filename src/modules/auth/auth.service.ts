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
