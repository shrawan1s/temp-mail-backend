import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  LoginDto,
  RefreshTokenDto,
  OAuthLoginDto,
  PasswordResetDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto';
import { ICurrentUserData } from '../../common/interfaces';

/**
 * REST API controller for authentication endpoints.
 * Routes are prefixed with /api/v1/auth
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /auth/register - Create new user account */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
  }

  /** POST /auth/verify-email - Verify email with 6-digit code */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail({
      user_id: dto.userId,
      code: dto.code,
    });
  }

  /** POST /auth/resend-verification - Resend verification code */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationCode({
      email: dto.email,
    });
  }

  /** POST /auth/login - Authenticate with email/password */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login({
      email: dto.email,
      password: dto.password,
    });
  }

  /** POST /auth/logout - End current session (requires auth) */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: ICurrentUserData,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.logout({
      user_id: user.userId,
      access_token: token,
    });
  }

  /** POST /auth/refresh - Get new tokens using refresh token */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken({
      refresh_token: dto.refreshToken,
    });
  }

  /** POST /auth/oauth/:provider - OAuth login (Google/GitHub) */
  @Public()
  @Post('oauth/:provider')
  async oAuthLogin(@Body() dto: OAuthLoginDto) {
    return this.authService.oAuthLogin({
      provider: dto.provider,
      code: dto.code,
      redirect_uri: dto.redirectUri,
    });
  }

  /** POST /auth/password-reset/request - Send password reset email */
  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: PasswordResetDto) {
    return this.authService.requestPasswordReset({
      email: dto.email,
    });
  }

  /** POST /auth/password-reset/confirm - Set new password with token */
  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword({
      token: dto.token,
      new_password: dto.newPassword,
    });
  }

  /** GET /auth/me - Get current user profile (requires auth) */
  @Get('me')
  async getProfile(@CurrentUser() user: ICurrentUserData) {
    return this.authService.getUser({
      user_id: user.userId,
    });
  }

  /** PUT /auth/me - Update current user profile (requires auth) */
  @Put('me')
  async updateProfile(
    @CurrentUser() user: ICurrentUserData,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateUser({
      user_id: user.userId,
      name: dto.name,
      avatar_url: dto.avatarUrl,
    });
  }

  /**
   * GET /auth/health - Health check for auth service.
   * Public endpoint for monitoring.
   * @returns Health status from auth service
   */
  @Public()
  @SkipThrottle()
  @Get('health')
  async health() {
    return this.authService.health();
  }

  /**
   * GET /auth/health/ready - Readiness check for auth service.
   * Public endpoint for monitoring.
   */
  @Public()
  @SkipThrottle()
  @Get('health/ready')
  async healthReady() {
    return this.authService.healthReady();
  }

  /**
   * GET /auth/health/live - Liveness check for auth service.
   * Public endpoint for monitoring.
   */
  @Public()
  @SkipThrottle()
  @Get('health/live')
  async healthLive() {
    return this.authService.healthLive();
  }
}
