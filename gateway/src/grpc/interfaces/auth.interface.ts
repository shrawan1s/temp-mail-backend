import { Observable } from 'rxjs';

// Auth Service Interfaces
export interface AuthServiceClient {
  register(data: RegisterRequest): Observable<RegisterResponse>;
  verifyEmail(data: VerifyEmailRequest): Observable<AuthResponse>;
  resendVerificationCode(data: ResendVerificationRequest): Observable<ResendVerificationResponse>;
  login(data: LoginRequest): Observable<AuthResponse>;
  logout(data: LogoutRequest): Observable<LogoutResponse>;
  refreshToken(data: RefreshTokenRequest): Observable<AuthResponse>;
  validateToken(data: ValidateTokenRequest): Observable<ValidateTokenResponse>;
  getUser(data: GetUserRequest): Observable<UserResponse>;
  updateUser(data: UpdateUserRequest): Observable<UserResponse>;
  oAuthLogin(data: OAuthLoginRequest): Observable<AuthResponse>;
  requestPasswordReset(data: PasswordResetRequest): Observable<PasswordResetResponse>;
  resetPassword(data: ResetPasswordConfirmRequest): Observable<ResetPasswordConfirmResponse>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: string;
}

export interface VerifyEmailRequest {
  user_id: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: User;
}

export interface LogoutRequest {
  user_id: string;
  access_token: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ValidateTokenRequest {
  access_token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user_id?: string;
  email?: string;
}

export interface GetUserRequest {
  user_id: string;
}

export interface UpdateUserRequest {
  user_id: string;
  name?: string;
  avatar_url?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface OAuthLoginRequest {
  provider: string;
  code: string;
  redirect_uri: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordConfirmResponse {
  success: boolean;
  message: string;
}
