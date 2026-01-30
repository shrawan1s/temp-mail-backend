// TOKEN TYPES
export interface ITokenPayload {
  sub: string;
  email: string;
  exp?: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

// USER TYPES
export interface IUserDto {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface ISettingsDto {
  dark_mode: boolean;
  auto_refresh: boolean;
  email_expiry: string;
  notifications: boolean;
  blocked_senders: string[];
}

// OAUTH TYPES
export interface IOAuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface IGoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

export interface IGoogleUserResponse {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface IGithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

export interface IGithubUserResponse {
  id: number;
  login: string;
  name: string;
  email: string | null;
  avatar_url: string;
}

export interface IGithubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

// AUTH DATA TYPES (for API responses)
export interface IAuthData {
  user?: IUserDto;
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
}

export interface ISettingsData {
  settings: ISettingsDto;
}
