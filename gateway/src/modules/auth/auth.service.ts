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

@Injectable()
export class AuthService implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return firstValueFrom(this.authService.register(data));
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.verifyEmail(data));
  }

  async resendVerificationCode(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    return firstValueFrom(this.authService.resendVerificationCode(data));
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.login(data));
  }

  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return firstValueFrom(this.authService.logout(data));
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.refreshToken(data));
  }

  async oAuthLogin(data: OAuthLoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.authService.oAuthLogin(data));
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    return firstValueFrom(this.authService.requestPasswordReset(data));
  }

  async resetPassword(data: ResetPasswordConfirmRequest): Promise<ResetPasswordConfirmResponse> {
    return firstValueFrom(this.authService.resetPassword(data));
  }

  async getUser(data: GetUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.authService.getUser(data));
  }

  async updateUser(data: UpdateUserRequest): Promise<UserResponse> {
    return firstValueFrom(this.authService.updateUser(data));
  }
}
