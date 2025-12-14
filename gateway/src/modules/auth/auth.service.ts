import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AuthServiceClient,
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
} from '../../grpc/interfaces';

/**
 * Gateway service for authentication operations.
 * Proxies HTTP requests to the Auth Service via gRPC.
 */
@Injectable()
export class AuthService implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  /** Register a new user account */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return firstValueFrom(this.authService.register(data));
  }

  /** Verify user email with 6-digit code */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.verifyEmail(data));
  }

  /** Resend email verification code */
  async resendVerificationCode(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    return firstValueFrom(this.authService.resendVerificationCode(data));
  }

  /** Authenticate user with email/password */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.login(data));
  }

  /** Revoke user's current session */
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return firstValueFrom(this.authService.logout(data));
  }

  /** Get new tokens using refresh token */
  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.refreshToken(data));
  }

  /** Authenticate via Google or GitHub OAuth */
  async oAuthLogin(data: OAuthLoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.oAuthLogin(data));
  }

  /** Request password reset email */
  async requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    return firstValueFrom(this.authService.requestPasswordReset(data));
  }

  /** Set new password using reset token */
  async resetPassword(data: ResetPasswordConfirmRequest): Promise<ResetPasswordConfirmResponse> {
    return firstValueFrom(this.authService.resetPassword(data));
  }

  /** Get user profile by ID */
  async getUser(data: GetUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.authService.getUser(data));
  }

  /** Update user profile (name, avatar) */
  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.authService.updateUser(data));
  }
}
