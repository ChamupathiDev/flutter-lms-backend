import type {
  Request,
  RequestHandler,
} from 'express';

import {
  AppError,
} from '../errors/AppError';

import {
  loginUser,
  logoutCurrentSession,
  logoutEverySession,
  refreshAuthentication,
  registerInstructorUser,
  registerStudentUser,
  requestPasswordReset,
  resendVerificationOtp,
  resetUserPassword,
  verifyPasswordResetOtp,
  verifyUserEmail,
} from '../services/auth.service';

import {
  createSuccessResponse,
} from '../utils/apiResponse';

import {
  asyncHandler,
} from '../utils/asyncHandler';

import {
  getSessionMetadata,
} from '../utils/sessionMetadata';

import type {
  ForgotPasswordInput,
  InstructorRegisterInput,
  LoginInput,
  RefreshTokenInput,
  ResendVerificationOtpInput,
  ResetPasswordInput,
  StudentRegisterInput,
  VerifyEmailInput,
  VerifyPasswordResetOtpInput,
} from '../validators/auth.validator';

const getValidatedBody = <T>(
  request: Request,
): T => {
  return request.validated
    ?.body as T;
};

export const registerStudent:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<StudentRegisterInput>(
            request,
          );

        const result =
          await registerStudentUser(
            input,
          );

        response
          .status(201)
          .json(
            createSuccessResponse(
              'Student registration successful. Check your email for the verification OTP.',
              result,
            ),
          );
      },
    );

export const registerInstructor:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<InstructorRegisterInput>(
            request,
          );

        const result =
          await registerInstructorUser(
            input,
          );

        response
          .status(201)
          .json(
            createSuccessResponse(
              'Instructor registration successful. Check your email for the verification OTP.',
              result,
            ),
          );
      },
    );

export const verifyEmail:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<VerifyEmailInput>(
            request,
          );

        const result =
          await verifyUserEmail(
            input,
            getSessionMetadata(
              request,
            ),
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Email verified and login completed successfully',
              result,
            ),
          );
      },
    );

export const resendEmailVerificationOtp:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<ResendVerificationOtpInput>(
            request,
          );

        await resendVerificationOtp(
          input,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'A new verification OTP has been sent',
              null,
            ),
          );
      },
    );

export const login:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<LoginInput>(
            request,
          );

        const result =
          await loginUser(
            input,
            getSessionMetadata(
              request,
            ),
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Login successful',
              result,
            ),
          );
      },
    );

export const refreshToken:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<RefreshTokenInput>(
            request,
          );

        const result =
          await refreshAuthentication(
            input.refreshToken,
            getSessionMetadata(
              request,
            ),
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Authentication tokens refreshed successfully',
              result,
            ),
          );
      },
    );

export const forgotPassword:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<ForgotPasswordInput>(
            request,
          );

        await requestPasswordReset(
          input,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'If an active account exists for this email, a password-reset OTP has been sent',
              null,
            ),
          );
      },
    );

export const verifyResetOtp:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<VerifyPasswordResetOtpInput>(
            request,
          );

        const result =
          await verifyPasswordResetOtp(
            input,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Password-reset OTP verified successfully',
              result,
            ),
          );
      },
    );

export const resetPassword:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const input =
          getValidatedBody<ResetPasswordInput>(
            request,
          );

        await resetUserPassword(
          input,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Password reset successfully. Please sign in again.',
              null,
            ),
          );
      },
    );

export const logout:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        if (!request.auth) {
          throw new AppError(
            'Authentication is required',
            401,
            'AUTHENTICATION_REQUIRED',
          );
        }

        await logoutCurrentSession(
          request.auth.userId,
          request.auth.sessionId,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Logout successful',
              null,
            ),
          );
      },
    );

export const logoutAll:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        if (!request.auth) {
          throw new AppError(
            'Authentication is required',
            401,
            'AUTHENTICATION_REQUIRED',
          );
        }

        await logoutEverySession(
          request.auth.userId,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Logged out from all devices successfully',
              null,
            ),
          );
      },
    );