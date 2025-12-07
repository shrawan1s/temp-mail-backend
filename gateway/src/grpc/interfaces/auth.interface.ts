import { Observable } from 'rxjs';

// Auth Service Interfaces
export interface AuthServiceClient {
  register(data: RegisterRequest): Observable<AuthResponse>;
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

export interface LogoutRequest {
  userId: string;
  accessToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ValidateTokenRequest {
  accessToken: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
  email?: string;
}

export interface GetUserRequest {
  userId: string;
}

export interface UpdateUserRequest {
  userId: string;
  name?: string;
  avatarUrl?: string;
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
  avatarUrl?: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthLoginRequest {
  provider: string;
  code: string;
  redirectUri: string;
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
  newPassword: string;
}

export interface ResetPasswordConfirmResponse {
  success: boolean;
  message: string;
}
