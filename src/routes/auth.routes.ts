import {
  Router,
} from 'express';

import {
  forgotPassword,
  login,
  logout,
  logoutAll,
  refreshToken,
  registerInstructor,
  registerStudent,
  resendEmailVerificationOtp,
  resetPassword,
  verifyEmail,
  verifyResetOtp,
} from '../controllers/auth.controller';

import {
  authenticate,
} from '../middlewares/authenticate.middleware';

import {
  loginRateLimiter,
  otpRateLimiter,
  refreshRateLimiter,
  registrationRateLimiter,
} from '../middlewares/rateLimit.middleware';

import {
  validateRequest,
} from '../middlewares/validate.middleware';

import {
  forgotPasswordBodySchema,
  instructorRegisterBodySchema,
  loginBodySchema,
  refreshTokenBodySchema,
  resendVerificationOtpBodySchema,
  resetPasswordBodySchema,
  studentRegisterBodySchema,
  verifyEmailBodySchema,
  verifyPasswordResetOtpBodySchema,
} from '../validators/auth.validator';

const authRouter =
  Router();

authRouter.post(
  '/register/student',

  registrationRateLimiter,

  validateRequest({
    body:
      studentRegisterBodySchema,
  }),

  registerStudent,
);

authRouter.post(
  '/register/instructor',

  registrationRateLimiter,

  validateRequest({
    body:
      instructorRegisterBodySchema,
  }),

  registerInstructor,
);

authRouter.post(
  '/verify-email',

  otpRateLimiter,

  validateRequest({
    body:
      verifyEmailBodySchema,
  }),

  verifyEmail,
);

authRouter.post(
  '/resend-verification-otp',

  otpRateLimiter,

  validateRequest({
    body:
      resendVerificationOtpBodySchema,
  }),

  resendEmailVerificationOtp,
);

authRouter.post(
  '/login',

  loginRateLimiter,

  validateRequest({
    body:
      loginBodySchema,
  }),

  login,
);

authRouter.post(
  '/refresh-token',

  refreshRateLimiter,

  validateRequest({
    body:
      refreshTokenBodySchema,
  }),

  refreshToken,
);

authRouter.post(
  '/forgot-password',

  otpRateLimiter,

  validateRequest({
    body:
      forgotPasswordBodySchema,
  }),

  forgotPassword,
);

authRouter.post(
  '/verify-password-reset-otp',

  otpRateLimiter,

  validateRequest({
    body:
      verifyPasswordResetOtpBodySchema,
  }),

  verifyResetOtp,
);

authRouter.post(
  '/reset-password',

  otpRateLimiter,

  validateRequest({
    body:
      resetPasswordBodySchema,
  }),

  resetPassword,
);

authRouter.post(
  '/logout',

  authenticate,

  logout,
);

authRouter.post(
  '/logout-all',

  authenticate,

  logoutAll,
);

export default authRouter;