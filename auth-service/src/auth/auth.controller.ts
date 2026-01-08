import { Controller, Post, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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
import { InternalApiKeyGuard } from '../guards';

/**
 * HTTP controller for authentication operations.
 * Delegates all business logic to AuthService.
 * All endpoints are called by the Gateway service.
 * Protected by InternalApiKeyGuard to ensure only authorized services can call.
 */
@Controller('auth')
@UseGuards(InternalApiKeyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register - Register a new user and send verification email.
   */
  @Post('register')
  async register(@Body() data: IRegisterRequest): Promise<IRegisterResponse> {
    return this.authService.register(data);
  }

  /**
   * POST /auth/verify-email - Verify user email with 6-digit code.
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() data: IVerifyEmailRequest): Promise<IAuthResponse> {
    return this.authService.verifyEmail(data);
  }

  /**
   * POST /auth/resend-verification - Resend email verification code.
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body() data: IResendVerificationRequest): Promise<IResendVerificationResponse> {
    return this.authService.resendVerificationCode(data);
  }

  /**
   * POST /auth/login - Authenticate user with email and password.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: ILoginRequest): Promise<IAuthResponse> {
    return this.authService.login(data);
  }

  /**
   * POST /auth/logout - End user session by blacklisting the access token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() data: ILogoutRequest): Promise<ILogoutResponse> {
    return this.authService.logout(data);
  }

  /**
   * POST /auth/refresh - Exchange refresh token for new access/refresh token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() data: IRefreshTokenRequest): Promise<IAuthResponse> {
    return this.authService.refreshToken(data);
  }

  /**
   * POST /auth/validate-token - Validate access token and return user info if valid.
   */
  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() data: IValidateTokenRequest): Promise<IValidateTokenResponse> {
    return this.authService.validateToken(data);
  }

  /**
   * POST /auth/get-user - Get user profile by ID.
   */
  @Post('get-user')
  @HttpCode(HttpStatus.OK)
  async getUser(@Body() data: IGetUserRequest): Promise<IUserResponse> {
    return this.authService.getUser(data);
  }

  /**
   * PUT /auth/update-user - Update user profile (name and/or avatar).
   */
  @Put('update-user')
  async updateUser(@Body() data: IUserUpdateRequest): Promise<IUserResponse> {
    return this.authService.updateUser(data);
  }

  /**
   * POST /auth/oauth - Authenticate via OAuth (Google or GitHub).
   */
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  async oAuthLogin(@Body() data: IOAuthLoginRequest): Promise<IAuthResponse> {
    return this.authService.oAuthLogin(data);
  }

  /**
   * POST /auth/password-reset/request - Request password reset email.
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() data: IPasswordResetRequest): Promise<IPasswordResetResponse> {
    return this.authService.requestPasswordReset(data);
  }

  /**
   * POST /auth/password-reset/confirm - Set new password using reset token.
   */
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() data: IResetPasswordConfirmRequest): Promise<IResetPasswordConfirmResponse> {
    return this.authService.resetPassword(data);
  }
}
