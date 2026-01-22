export interface IUser {
  id: string;
  email: string;
  name: string;
  avatarUrl ?: string | null;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request interfaces - use snake_case to match proto
export interface IRegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILogoutRequest {
  user_id: string;
  access_token: string;
}

export interface IRefreshTokenRequest {
  refresh_token: string;
}

export interface IValidateTokenRequest {
  access_token: string;
}

export interface IGetUserRequest {
  user_id: string;
}

export interface IUserUpdateRequest {
  user_id: string;
  name?: string;
  avatar_url?: string;
}

export interface IOAuthLoginRequest {
  provider: string;
  code: string;
  redirect_uri: string;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IResetPasswordConfirmRequest {
  token: string;
  new_password: string;
}

export interface IVerifyEmailRequest {
  user_id: string;
  code: string;
}

export interface IResendVerificationRequest {
  email: string;
}

// Response interfaces - use snake_case to match proto
export interface IUserDto {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface IRegisterResponse {
  success: boolean;
  message: string;
  user_id?: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: IUserDto;
}

export interface ILogoutResponse {
  success: boolean;
  message: string;
}

export interface IValidateTokenResponse {
  valid: boolean;
  user_id?: string;
  email?: string;
}

export interface IUserResponse {
  success: boolean;
  message: string;
  user?: IUserDto;
}

export interface IPasswordResetResponse {
  success: boolean;
  message: string;
}

export interface IResetPasswordConfirmResponse {
  success: boolean;
  message: string;
}

export interface IResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface IUserSettings {
  dark_mode: boolean;
  auto_refresh: boolean;
  email_expiry: string;
  notifications: boolean;
  blocked_senders: string[];
}

export interface IGetSettingsRequest {
  user_id: string;
}

export interface ISettingsResponse {
  success: boolean;
  message: string;
  settings?: IUserSettings;
}

export interface IUpdateSettingsRequest {
  user_id: string;
  dark_mode?: boolean;
  auto_refresh?: boolean;
  email_expiry?: string;
  notifications?: boolean;
  blocked_senders?: string[];
}

export interface IChangePasswordRequest {
  user_id: string;
  current_password: string;
  new_password: string;
}

export interface IChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface IDeleteAccountRequest {
  user_id: string;
  password?: string;
}

export interface IDeleteAccountResponse {
  success: boolean;
  message: string;
}
