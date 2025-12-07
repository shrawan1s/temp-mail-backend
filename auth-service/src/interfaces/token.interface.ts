export interface ITokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}