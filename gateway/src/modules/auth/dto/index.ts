import { IsEmail, IsString, MinLength, IsOptional, Length, IsArray } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}

export class VerifyEmailDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class OAuthLoginDto {
  @IsString()
  provider: string;

  @IsString()
  code: string;

  @IsString()
  redirectUri: string;
}

export class PasswordResetDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  darkMode?: boolean;

  @IsOptional()
  autoRefresh?: boolean;

  @IsOptional()
  @IsString()
  emailExpiry?: string;

  @IsOptional()
  notifications?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedSenders?: string[];
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  password?: string;
}
