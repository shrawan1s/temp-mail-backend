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
  userId: string;
  accessToken: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IValidateTokenRequest {
  accessToken: string;
}

export interface IGetUserRequest {
  userId: string;
}

export interface IUserUpdateRequest {
  userId: string;
  name?: string;
  avatarUrl?: string;
}

export interface IOAuthLoginRequest {
  provider: string;
  code: string;
  redirectUri: string;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

export interface IUserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: IUserDto;
}

export interface ILogoutResponse {
  success: boolean;
  message: string;
}

export interface IValidateTokenResponse {
  valid: boolean;
  userId?: string;
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
