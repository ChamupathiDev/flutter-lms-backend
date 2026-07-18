import rateLimit from 'express-rate-limit';

const standardRateLimitResponse = {
  success: false,

  message:
    'Too many requests. Please try again later.',

  errorCode:
    'RATE_LIMIT_EXCEEDED',
};

export const loginRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message:
      standardRateLimitResponse,
  });

export const registrationRateLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit:
      10,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message:
      standardRateLimitResponse,
  });

export const otpRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      8,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message:
      standardRateLimitResponse,
  });

export const refreshRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message:
      standardRateLimitResponse,
  });