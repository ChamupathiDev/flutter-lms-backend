export const buildEmailVerificationTemplate = (
  firstName: string,
  otp: string,
  expiryMinutes: number,
): {
  subject: string;
  text: string;
  html: string;
} => ({
  subject:
    'Verify your Flutter LMS account',

  text:
    `Hello ${firstName}, your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,

  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
      <h2>Verify your Flutter LMS account</h2>

      <p>Hello ${firstName},</p>

      <p>
        Use the following one-time password to verify your email address:
      </p>

      <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">
        ${otp}
      </div>

      <p>
        This code expires in ${expiryMinutes} minutes.
      </p>

      <p>
        If you did not create this account, you can ignore this email.
      </p>
    </div>
  `,
});