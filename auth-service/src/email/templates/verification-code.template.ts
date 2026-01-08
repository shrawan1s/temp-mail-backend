/**
 * Email template for verification code.
 * @param name - User's name
 * @param code - 6-digit verification code
 */
export const verificationCodeTemplate = (name: string, code: string): string => `
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
