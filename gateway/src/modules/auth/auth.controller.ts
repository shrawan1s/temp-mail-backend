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
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  OAuthLoginDto,
  PasswordResetDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto';

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
    @CurrentUser() user: CurrentUserData,
    @Headers('authorization') auth: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.logout({
      userId: user.userId,
      accessToken: token,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken({
      refreshToken: dto.refreshToken,
    });
  }

  @Public()
  @Post('oauth/:provider')
  async oAuthLogin(@Body() dto: OAuthLoginDto) {
    return this.authService.oAuthLogin({
      provider: dto.provider,
      code: dto.code,
      redirectUri: dto.redirectUri,
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
      newPassword: dto.newPassword,
    });
  }

  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return this.authService.getUser({
      userId: user.userId,
    });
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateUser({
      userId: user.userId,
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });
  }
}
