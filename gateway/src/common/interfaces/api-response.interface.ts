/**
 * Standard API response interface for success responses.
 */
export interface ISuccessResponse<T = unknown> {
    success: true;
    data: T;
    message: string;
}

/**
 * Standard API response interface for error responses.
 */
export interface IErrorResponse {
    success: false;
    data: null;
    message: string;
}

/**
 * Union type for all API responses.
 */
export type IApiResponse<T = unknown> = ISuccessResponse<T> | IErrorResponse;
