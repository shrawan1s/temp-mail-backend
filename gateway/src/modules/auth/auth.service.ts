import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../../common/constants';
import { HttpMethod } from '../../common/enums';
import { ENDPOINTS } from '../../config';
import {
  AuthResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ResendVerificationResponse,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  OAuthLoginRequest,
  PasswordResetRequest,
  PasswordResetResponse,
  ResetPasswordConfirmRequest,
  ResetPasswordConfirmResponse,
  GetUserRequest,
  UpdateUserRequest,
  UserResponse,
} from '../../common/interfaces';

/**
 * Gateway service for authentication operations.
 * Proxies HTTP requests to the Auth Service via HTTP.
 * Uses ConfigService for base URLs, ENDPOINTS for paths.
 */
@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(private configService: ConfigService) {
    this.authServiceUrl = this.configService.get<string>('app.authServiceUrl') || '';
    this.internalApiKey = this.configService.get<string>('app.internalApiKey') || '';
  }

  private async httpRequest<T>(endpoint: string, method: HttpMethod, body?: unknown): Promise<T> {
    const url = `${this.authServiceUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': this.internalApiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new HttpException(data.message || ERROR_MESSAGES.AUTH_SERVICE_ERROR, response.status);
    }

    return data as T;
  }

  /** Register a new user account */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.httpRequest<RegisterResponse>(ENDPOINTS.auth.register, HttpMethod.POST, data);
  }

  /** Verify user email with 6-digit code */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    return this.httpRequest<AuthResponse>(ENDPOINTS.auth.verifyEmail, HttpMethod.POST, data);
  }

  /** Resend email verification code */
  async resendVerificationCode(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    return this.httpRequest<ResendVerificationResponse>(ENDPOINTS.auth.resendVerification, HttpMethod.POST, data);
  }

  /** Authenticate user with email/password */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.httpRequest<AuthResponse>(ENDPOINTS.auth.login, HttpMethod.POST, data);
  }

  /** Revoke user's current session */
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return this.httpRequest<LogoutResponse>(ENDPOINTS.auth.logout, HttpMethod.POST, data);
  }

  /** Get new tokens using refresh token */
  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return this.httpRequest<AuthResponse>(ENDPOINTS.auth.refresh, HttpMethod.POST, data);
  }

  /** Authenticate via Google or GitHub OAuth */
  async oAuthLogin(data: OAuthLoginRequest): Promise<AuthResponse> {
    return this.httpRequest<AuthResponse>(ENDPOINTS.auth.oauth, HttpMethod.POST, data);
  }

  /** Request password reset email */
  async requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    return this.httpRequest<PasswordResetResponse>(ENDPOINTS.auth.passwordResetRequest, HttpMethod.POST, data);
  }

  /** Set new password using reset token */
  async resetPassword(data: ResetPasswordConfirmRequest): Promise<ResetPasswordConfirmResponse> {
    return this.httpRequest<ResetPasswordConfirmResponse>(ENDPOINTS.auth.passwordResetConfirm, HttpMethod.POST, data);
  }

  /** Get user profile by ID */
  async getUser(data: GetUserRequest): Promise<UserResponse> {
    return this.httpRequest<UserResponse>(ENDPOINTS.auth.getUser, HttpMethod.POST, data);
  }

  /** Update user profile (name, avatar) */
  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    return this.httpRequest<UserResponse>(ENDPOINTS.auth.updateUser, HttpMethod.PUT, data);
  }

  /** Health check - proxy to auth service */
  async health() {
    return this.httpRequest(ENDPOINTS.auth.health, HttpMethod.GET);
  }

  /** Readiness check - proxy to auth service */
  async healthReady() {
    return this.httpRequest(ENDPOINTS.auth.healthReady, HttpMethod.GET);
  }

  /** Liveness check - proxy to auth service */
  async healthLive() {
    return this.httpRequest(ENDPOINTS.auth.healthLive, HttpMethod.GET);
  }
}
