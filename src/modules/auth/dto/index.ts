import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { OAuthProvider } from 'src/common';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  user_id: string;

  @IsString()
  code: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;
}

export class OAuthLoginDto {
  @IsString()
  provider: OAuthProvider;

  @IsString()
  code: string;

  @IsString()
  redirect_uri: string;
}

export class PasswordResetRequestDto {
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  dark_mode?: boolean;

  @IsOptional()
  auto_refresh?: boolean;

  @IsOptional()
  @IsString()
  email_expiry?: string;

  @IsOptional()
  notifications?: boolean;

  @IsOptional()
  blocked_senders?: string[];
}

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  password?: string;
}
