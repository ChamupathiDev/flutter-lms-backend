import { z } from 'zod';

import {
  instructorProfileFieldShape,
  studentProfileFieldShape,
} from './profile.validator';

const nameSchema = z
  .string()
  .trim()
  .min(
    2,
    'Must contain at least 2 characters',
  )
  .max(
    50,
    'Must contain at most 50 characters',
  )
  .regex(
    /^[\p{L}\p{M}' -]+$/u,
    'May contain letters, spaces, apostrophes and hyphens only',
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(
    'A valid email address is required',
  )
  .max(254);

export const passwordSchema = z
  .string()
  .min(
    8,
    'Password must contain at least 8 characters',
  )
  .max(
    128,
    'Password must contain at most 128 characters',
  )
  .regex(
    /[a-z]/,
    'Password must contain a lowercase letter',
  )
  .regex(
    /[A-Z]/,
    'Password must contain an uppercase letter',
  )
  .regex(
    /[0-9]/,
    'Password must contain a number',
  )
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain a special character',
  );

const otpSchema = z
  .string()
  .trim()
  .regex(
    /^\d{6}$/,
    'OTP must contain exactly 6 digits',
  );

const registrationBaseShape = {
  firstName:
    nameSchema,

  lastName:
    nameSchema,

  email:
    emailSchema,

  password:
    passwordSchema,

  confirmPassword:
    z.string(),
};

export const studentRegisterBodySchema =
  z
    .object({
      ...registrationBaseShape,
      ...studentProfileFieldShape,
    })
    .strict()
    .refine(
      (data) =>
        data.password ===
        data.confirmPassword,
      {
        path: [
          'confirmPassword',
        ],

        message:
          'Passwords do not match',
      },
    );

export const instructorRegisterBodySchema =
  z
    .object({
      ...registrationBaseShape,
      ...instructorProfileFieldShape,
    })
    .strict()
    .refine(
      (data) =>
        data.password ===
        data.confirmPassword,
      {
        path: [
          'confirmPassword',
        ],

        message:
          'Passwords do not match',
      },
    );

export const verifyEmailBodySchema =
  z
    .object({
      email:
        emailSchema,

      otp:
        otpSchema,
    })
    .strict();

export const resendVerificationOtpBodySchema =
  z
    .object({
      email:
        emailSchema,
    })
    .strict();

export const loginBodySchema =
  z
    .object({
      email:
        emailSchema,

      password:
        z
          .string()
          .min(
            1,
            'Password is required',
          ),
    })
    .strict();

export const refreshTokenBodySchema =
  z
    .object({
      refreshToken:
        z
          .string()
          .trim()
          .min(
            1,
            'Refresh token is required',
          ),
    })
    .strict();

export const forgotPasswordBodySchema =
  z
    .object({
      email:
        emailSchema,
    })
    .strict();

export const verifyPasswordResetOtpBodySchema =
  z
    .object({
      email:
        emailSchema,

      otp:
        otpSchema,
    })
    .strict();

export const resetPasswordBodySchema =
  z
    .object({
      resetToken:
        z
          .string()
          .trim()
          .min(
            1,
            'Reset token is required',
          ),

      newPassword:
        passwordSchema,

      confirmPassword:
        z.string(),
    })
    .strict()
    .refine(
      (data) =>
        data.newPassword ===
        data.confirmPassword,
      {
        path: [
          'confirmPassword',
        ],

        message:
          'Passwords do not match',
      },
    );

export type StudentRegisterInput =
  z.infer<
    typeof studentRegisterBodySchema
  >;

export type InstructorRegisterInput =
  z.infer<
    typeof instructorRegisterBodySchema
  >;

export type VerifyEmailInput =
  z.infer<
    typeof verifyEmailBodySchema
  >;

export type ResendVerificationOtpInput =
  z.infer<
    typeof resendVerificationOtpBodySchema
  >;

export type LoginInput =
  z.infer<
    typeof loginBodySchema
  >;

export type RefreshTokenInput =
  z.infer<
    typeof refreshTokenBodySchema
  >;

export type ForgotPasswordInput =
  z.infer<
    typeof forgotPasswordBodySchema
  >;

export type VerifyPasswordResetOtpInput =
  z.infer<
    typeof verifyPasswordResetOtpBodySchema
  >;

export type ResetPasswordInput =
  z.infer<
    typeof resetPasswordBodySchema
  >;