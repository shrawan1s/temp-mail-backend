import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public, CurrentUser, ICurrentUser } from '../../common/decorators';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RefreshTokenDto,
  OAuthLoginDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  UpdateUserDto,
  UpdateSettingsDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from './dto';

/**
 * Auth Controller
 * Handles all authentication endpoints.
 * Public routes marked with @Public() decorator skip JWT auth.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user', description: 'Creates a new user account and sends verification email' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or user already exists' })
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data.email, data.password, data.name);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address', description: 'Verifies user email with 6-digit code' })
  @ApiResponse({ status: 200, description: 'Email verified, returns auth tokens' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  async verifyEmail(@Body() data: VerifyEmailDto) {
    return this.authService.verifyEmail(data.user_id, data.code);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification code', description: 'Sends a new verification code to the email' })
  @ApiResponse({ status: 200, description: 'Verification code sent if account exists' })
  async resendVerificationCode(@Body() data: ResendVerificationDto) {
    return this.authService.resendVerificationCode(data.email);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticates user with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns auth tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or unverified email' })
  async login(@Body() data: LoginDto) {
    return this.authService.login(data.email, data.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', description: 'Gets new tokens using refresh token' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.refreshToken(data.refreshToken!);
  }

  @Public()
  @SkipThrottle()
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OAuth login', description: 'Login/register via Google or GitHub OAuth' })
  @ApiResponse({ status: 200, description: 'OAuth login successful' })
  @ApiResponse({ status: 400, description: 'OAuth authentication failed' })
  async oAuthLogin(@Body() data: OAuthLoginDto) {
    return this.authService.oAuthLogin(
      data.provider,
      data.code,
      data.redirect_uri,
    );
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset', description: 'Sends password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  async requestPasswordReset(@Body() data: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset', description: 'Sets new password using reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(@Body() data: PasswordResetConfirmDto) {
    return this.authService.resetPassword(data.token, data.new_password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user', description: 'Invalidates the current access token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user', description: 'Returns authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUser(@CurrentUser() user: ICurrentUser) {
    return this.authService.getUser(user.userId);
  }

  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile', description: 'Updates user name and/or avatar' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUser(
    @CurrentUser() user: ICurrentUser,
    @Body() data: UpdateUserDto,
  ) {
    return this.authService.updateUser(user.userId, data.name, data.avatar_url);
  }

  @Get('settings')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user settings', description: 'Returns user preferences and settings' })
  @ApiResponse({ status: 200, description: 'Settings returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(@CurrentUser() user: ICurrentUser) {
    return this.authService.getSettings(user.userId);
  }

  @Put('settings')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user settings', description: 'Updates user preferences' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSettings(
    @CurrentUser() user: ICurrentUser,
    @Body() data: UpdateSettingsDto,
  ) {
    return this.authService.updateSettings(user.userId, {
      darkMode: data.dark_mode,
      autoRefresh: data.auto_refresh,
      emailExpiry: data.email_expiry,
      notifications: data.notifications,
      blockedSenders: data.blocked_senders,
    });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password', description: 'Changes user password (requires current password)' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: ICurrentUser,
    @Body() data: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      data.current_password,
      data.new_password,
    );
  }

  @Delete('account')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete account', description: 'Permanently deletes user account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 400, description: 'Password verification failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(
    @CurrentUser() user: ICurrentUser,
    @Body() data: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.userId, data.password);
  }
}
