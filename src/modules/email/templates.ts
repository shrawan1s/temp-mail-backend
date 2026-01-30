/**
 * Email template for verification code.
 */
export const verificationCodeTemplate = (
  name: string,
  code: string,
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to TempMail!</h2>
    <p>Hi ${name},</p>
    <p>Your verification code is:</p>
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
      ${code}
    </div>
    <p>This code expires in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
`;

/**
 * Email template for password reset.
 */
export const passwordResetTemplate = (
  name: string,
  resetLink: string,
): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    </div>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
`;
