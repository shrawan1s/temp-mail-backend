// STANDARD API RESPONSE
export interface IApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

// CURRENT USER (from request)
export interface ICurrentUser {
  userId: string;
  email: string;
}

// ERROR RESPONSE (for exception filter)
export interface IErrorResponse {
  success: false;
  message: string;
  data: null;
}
