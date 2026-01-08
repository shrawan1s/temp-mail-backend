/**
 * Centralized service endpoint configuration.
 * This is a plain object accessible at compile time, not a NestJS config.
 * Change these paths to update endpoints across the gateway.
 */
export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    validateToken: '/auth/validate-token',
    oauth: '/auth/oauth',
    passwordResetRequest: '/auth/password-reset/request',
    passwordResetConfirm: '/auth/password-reset/confirm',
    getUser: '/auth/get-user',
    updateUser: '/auth/update-user',
  },
  payment: {
    plans: '/payment/plans',
    createOrder: '/payment/create-order',
    verify: '/payment/verify',
    subscription: '/payment/subscription',
  },
} as const;
