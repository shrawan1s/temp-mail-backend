import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OAuthProvider } from 'src/common';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 6 characters)', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'User ID from registration', example: 'uuid-here' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: '6-digit verification code', example: '123456' })
  @IsString()
  code: string;
}

export class ResendVerificationDto {
  @ApiProperty({ description: 'Email to resend verification code to', example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token for getting new access token' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class OAuthLoginDto {
  @ApiProperty({ description: 'OAuth provider', enum: ['google', 'github'] })
  @IsString()
  provider: OAuthProvider;

  @ApiProperty({ description: 'Authorization code from OAuth callback' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'OAuth redirect URI used in the flow' })
  @IsString()
  redirect_uri: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ description: 'Email to send password reset link', example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty({ description: 'Password reset token from email link' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password (min 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  new_password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'New display name', example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL' })
  @IsOptional()
  @IsString()
  avatar_url?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Enable dark mode' })
  @IsOptional()
  @IsBoolean()
  dark_mode?: boolean;

  @ApiPropertyOptional({ description: 'Enable auto-refresh for emails' })
  @IsOptional()
  @IsBoolean()
  auto_refresh?: boolean;

  @ApiPropertyOptional({ description: 'Email expiry duration', example: '24h' })
  @IsOptional()
  @IsString()
  email_expiry?: string;

  @ApiPropertyOptional({ description: 'Enable notifications' })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @ApiPropertyOptional({ description: 'List of blocked sender addresses', type: [String] })
  @IsOptional()
  @IsArray()
  blocked_senders?: string[];
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  current_password: string;

  @ApiProperty({ description: 'New password (min 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  new_password: string;
}

export class DeleteAccountDto {
  @ApiPropertyOptional({ description: 'Password for account verification (required for password-based accounts)' })
  @IsOptional()
  @IsString()
  password?: string;
}
