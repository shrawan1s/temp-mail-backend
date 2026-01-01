import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
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
  IUserResponse,
  IUserUpdateRequest,
  IValidateTokenRequest,
  IValidateTokenResponse,
  IVerifyEmailRequest,
} from '../interfaces';

/**
 * gRPC controller for authentication operations.
 * Delegates all business logic to AuthService.
 * All methods are exposed via gRPC and called by the Gateway service.
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Register a new user and send verification email.
   */
  @GrpcMethod('AuthService', 'Register')
  async register(data: IRegisterRequest): Promise<IRegisterResponse> {
    return this.authService.register(data);
  }

  /**
   * Verify user email with 6-digit code.
   */
  @GrpcMethod('AuthService', 'VerifyEmail')
  async verifyEmail(data: IVerifyEmailRequest): Promise<IAuthResponse> {
    return this.authService.verifyEmail(data);
  }

  /**
   * Resend email verification code.
   */
  @GrpcMethod('AuthService', 'ResendVerificationCode')
  async resendVerificationCode(data: IResendVerificationRequest): Promise<IResendVerificationResponse> {
    return this.authService.resendVerificationCode(data);
  }

  /**
   * Authenticate user with email and password.
   */
  @GrpcMethod('AuthService', 'Login')
  async login(data: ILoginRequest): Promise<IAuthResponse> {
    return this.authService.login(data);
  }

  /**
   * End user session by blacklisting the access token.
   */
  @GrpcMethod('AuthService', 'Logout')
  async logout(data: ILogoutRequest): Promise<ILogoutResponse> {
    return this.authService.logout(data);
  }

  /**
   * Exchange refresh token for new access/refresh token pair.
   */
  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: IRefreshTokenRequest): Promise<IAuthResponse> {
    return this.authService.refreshToken(data);
  }

  /**
   * Validate access token and return user info if valid.
   */
  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: IValidateTokenRequest): Promise<IValidateTokenResponse> {
    return this.authService.validateToken(data);
  }

  /**
   * Get user profile by ID.
   */
  @GrpcMethod('AuthService', 'GetUser')
  async getUser(data: IGetUserRequest): Promise<IUserResponse> {
    return this.authService.getUser(data);
  }

  /**
   * Update user profile (name and/or avatar).
   */
  @GrpcMethod('AuthService', 'UpdateUser')
  async updateUser(data: IUserUpdateRequest): Promise<IUserResponse> {
    return this.authService.updateUser(data);
  }

  /**
   * Authenticate via OAuth (Google or GitHub).
   */
  @GrpcMethod('AuthService', 'OAuthLogin')
  async oAuthLogin(data: IOAuthLoginRequest): Promise<IAuthResponse> {
    return this.authService.oAuthLogin(data);
  }

  /**
   * Request password reset email.
   */
  @GrpcMethod('AuthService', 'RequestPasswordReset')
  async requestPasswordReset(data: IPasswordResetRequest): Promise<IPasswordResetResponse> {
    return this.authService.requestPasswordReset(data);
  }

  /**
   * Set new password using reset token.
   */
  @GrpcMethod('AuthService', 'ResetPassword')
  async resetPassword(data: IResetPasswordConfirmRequest): Promise<IResetPasswordConfirmResponse> {
    return this.authService.resetPassword(data);
  }
}
