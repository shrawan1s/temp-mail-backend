/**
 * Response from auth-service token validation endpoint.
 */
export interface IValidateTokenResponse {
  valid: boolean;
  user_id?: string;
  email?: string;
}
