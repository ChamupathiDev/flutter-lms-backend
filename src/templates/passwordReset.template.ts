export const buildPasswordResetTemplate = (
  firstName: string,
  otp: string,
  expiryMinutes: number,
): {
  subject: string;
  text: string;
  html: string;
} => ({
  subject:
    'Reset your Flutter LMS password',

  text:
    `Hello ${firstName}, your password reset code is ${otp}. It expires in ${expiryMinutes} minutes.`,

  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
      <h2>Reset your Flutter LMS password</h2>

      <p>Hello ${firstName},</p>

      <p>
        Use the following one-time password to continue resetting your password:
      </p>

      <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">
        ${otp}
      </div>

      <p>
        This code expires in ${expiryMinutes} minutes.
      </p>

      <p>
        If you did not request a password reset, you can ignore this email.
      </p>
    </div>
  `,
});