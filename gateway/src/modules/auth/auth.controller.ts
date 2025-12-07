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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail({
      user_id: dto.userId,
      code: dto.code,
    });
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationCode({
      email: dto.email,
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login({
      email: dto.email,
      password: dto.password,
    });
  }

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

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken({
      refresh_token: dto.refreshToken,
    });
  }

  @Public()
  @Post('oauth/:provider')
  async oAuthLogin(@Body() dto: OAuthLoginDto) {
    return this.authService.oAuthLogin({
      provider: dto.provider,
      code: dto.code,
      redirect_uri: dto.redirectUri,
    });
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: PasswordResetDto) {
    return this.authService.requestPasswordReset({
      email: dto.email,
    });
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword({
      token: dto.token,
      new_password: dto.newPassword,
    });
  }

  @Get('me')
  async getProfile(@CurrentUser() user: ICurrentUserData) {
    return this.authService.getUser({
      user_id: user.userId,
    });
  }

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
}
