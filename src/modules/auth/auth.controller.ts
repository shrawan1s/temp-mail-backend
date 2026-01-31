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
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data.email, data.password, data.name);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() data: VerifyEmailDto) {
    return this.authService.verifyEmail(data.user_id, data.code);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body() data: ResendVerificationDto) {
    return this.authService.resendVerificationCode(data.email);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto) {
    return this.authService.login(data.email, data.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.refreshToken(data.refreshToken!);
  }

  @Public()
  @SkipThrottle()
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
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
  async requestPasswordReset(@Body() data: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() data: PasswordResetConfirmDto) {
    return this.authService.resetPassword(data.token, data.new_password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Get('me')
  async getUser(@CurrentUser() user: ICurrentUser) {
    return this.authService.getUser(user.userId);
  }

  @Put('me')
  async updateUser(
    @CurrentUser() user: ICurrentUser,
    @Body() data: UpdateUserDto,
  ) {
    return this.authService.updateUser(user.userId, data.name, data.avatar_url);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: ICurrentUser) {
    return this.authService.getSettings(user.userId);
  }

  @Put('settings')
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
  async deleteAccount(
    @CurrentUser() user: ICurrentUser,
    @Body() data: DeleteAccountDto,
  ) {
    return this.authService.deleteAccount(user.userId, data.password);
  }
}
