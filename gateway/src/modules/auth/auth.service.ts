import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { GrpcClientService } from '../../grpc';
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
 * Includes internal API key in all gRPC calls for service authentication.
 */
@Injectable()
export class AuthService implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(
    @Inject('AUTH_PACKAGE') private client: ClientGrpc,
    private readonly grpcClientService: GrpcClientService,
  ) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  /** Register a new user account */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return firstValueFrom(this.authService.register(data, this.grpcClientService.getMetadata()));
  }

  /** Verify user email with 6-digit code */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.verifyEmail(data, this.grpcClientService.getMetadata()));
  }

  /** Resend email verification code */
  async resendVerificationCode(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    return firstValueFrom(this.authService.resendVerificationCode(data, this.grpcClientService.getMetadata()));
  }

  /** Authenticate user with email/password */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.login(data, this.grpcClientService.getMetadata()));
  }

  /** Revoke user's current session */
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return firstValueFrom(this.authService.logout(data, this.grpcClientService.getMetadata()));
  }

  /** Get new tokens using refresh token */
  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.refreshToken(data, this.grpcClientService.getMetadata()));
  }

  /** Authenticate via Google or GitHub OAuth */
  async oAuthLogin(data: OAuthLoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.oAuthLogin(data, this.grpcClientService.getMetadata()));
  }

  /** Request password reset email */
  async requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    return firstValueFrom(this.authService.requestPasswordReset(data, this.grpcClientService.getMetadata()));
  }

  /** Set new password using reset token */
  async resetPassword(data: ResetPasswordConfirmRequest): Promise<ResetPasswordConfirmResponse> {
    return firstValueFrom(this.authService.resetPassword(data, this.grpcClientService.getMetadata()));
  }

  /** Get user profile by ID */
  async getUser(data: GetUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.authService.getUser(data, this.grpcClientService.getMetadata()));
  }

  /** Update user profile (name, avatar) */
  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.authService.updateUser(data, this.grpcClientService.getMetadata()));
  }
}
