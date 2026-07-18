import bcrypt from 'bcrypt';
import { startSession } from 'mongoose';

import {
  OTP_PURPOSES,
} from '../constants/auth.constants';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../constants/user.constants';

import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';

import {
  InstructorProfile,
} from '../models/instructorProfile.model';

import {
  StudentProfile,
} from '../models/studentProfile.model';

import {
  User,
  type UserDocument,
} from '../models/user.model';

import type {
  SessionMetadata,
} from '../types/auth.types';

import type {
  ForgotPasswordInput,
  InstructorRegisterInput,
  LoginInput,
  ResetPasswordInput,
  ResendVerificationOtpInput,
  StudentRegisterInput,
  VerifyEmailInput,
  VerifyPasswordResetOtpInput,
} from '../validators/auth.validator';

import {
  sanitizeUser,
} from '../utils/sanitizeUser';

import {
  toInstructorProfileResponse,
  toStudentProfileResponse,
} from '../utils/profileResponse';

import {
  sendPasswordResetOtpEmail,
  sendVerificationOtpEmail,
} from './email.service';

import {
  issueOtp,
  removeOtp,
  verifyAndConsumeOtp,
} from './otp.service';

import {
  createPasswordResetToken,
  createTokenPair,
  revokeAllUserSessions,
  revokeSession,
  rotateRefreshToken,
  verifyPasswordResetToken,
} from './token.service';

const assertActiveAccount = (
  status: string,
): void => {
  if (
    status ===
    USER_STATUSES.SUSPENDED
  ) {
    throw new AppError(
      'This account has been suspended',
      403,
      'ACCOUNT_SUSPENDED',
    );
  }

  if (
    status !==
    USER_STATUSES.ACTIVE
  ) {
    throw new AppError(
      'This account is inactive',
      403,
      'ACCOUNT_INACTIVE',
    );
  }
};

const isDuplicateKeyError = (
  error: unknown,
): error is {
  code: number;
} => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
};

const sendRegistrationVerificationOtp =
  async (
    user: UserDocument,
  ): Promise<void> => {
    const otp =
      await issueOtp(
        user.email,
        OTP_PURPOSES.EMAIL_VERIFICATION,
      );

    try {
      await sendVerificationOtpEmail(
        user.email,
        user.firstName,
        otp,
      );
    } catch (error) {
      await removeOtp(
        user.email,
        OTP_PURPOSES.EMAIL_VERIFICATION,
      );

      throw error;
    }
  };

export const registerStudentUser =
  async (
    input: StudentRegisterInput,
  ) => {
    const passwordHash =
      await bcrypt.hash(
        input.password,
        environment.BCRYPT_ROUNDS,
      );

    const session =
      await startSession();

    try {
      const transactionResult =
        await session.withTransaction(
          async () => {
            const existingUser =
              await User.findOne({
                email: input.email,
              }).session(session);

            if (existingUser) {
              throw new AppError(
                'A user with this email address already exists',
                409,
                'EMAIL_ALREADY_EXISTS',
              );
            }

            /*
             * Creating a document instance and saving it avoids
             * the "possibly undefined" result produced by:
             *
             * const [user] = await User.create([...])
             */
            const user =
              new User({
                firstName:
                  input.firstName,

                lastName:
                  input.lastName,

                email:
                  input.email,

                passwordHash,

                role:
                  USER_ROLES.STUDENT,

                status:
                  USER_STATUSES.ACTIVE,

                emailVerified:
                  false,

                tokenVersion:
                  0,
              });

            await user.save({
              session,
            });

            const profile =
              new StudentProfile({
                userId:
                  user._id,

                dateOfBirth:
                  input.dateOfBirth,

                educationLevel:
                  input.educationLevel,

                learningGoals:
                  input.learningGoals,
              });

            await profile.save({
              session,
            });

            return {
              user,
              profile,
            };
          },
        );

      if (!transactionResult) {
        throw new AppError(
          'Student registration could not be completed',
          500,
          'STUDENT_REGISTRATION_FAILED',
        );
      }

      await sendRegistrationVerificationOtp(
        transactionResult.user,
      );

      return {
        user:
          sanitizeUser(
            transactionResult.user,
          ),

        profile:
          toStudentProfileResponse(
            transactionResult.profile,
          ),

        verificationRequired:
          true as const,
      };
    } catch (error) {
      if (
        isDuplicateKeyError(error)
      ) {
        throw new AppError(
          'A user with this email address already exists',
          409,
          'EMAIL_ALREADY_EXISTS',
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }
  };

export const registerInstructorUser =
  async (
    input: InstructorRegisterInput,
  ) => {
    const passwordHash =
      await bcrypt.hash(
        input.password,
        environment.BCRYPT_ROUNDS,
      );

    const session =
      await startSession();

    try {
      const transactionResult =
        await session.withTransaction(
          async () => {
            const existingUser =
              await User.findOne({
                email: input.email,
              }).session(session);

            if (existingUser) {
              throw new AppError(
                'A user with this email address already exists',
                409,
                'EMAIL_ALREADY_EXISTS',
              );
            }

            const user =
              new User({
                firstName:
                  input.firstName,

                lastName:
                  input.lastName,

                email:
                  input.email,

                passwordHash,

                role:
                  USER_ROLES.INSTRUCTOR,

                status:
                  USER_STATUSES.ACTIVE,

                emailVerified:
                  false,

                tokenVersion:
                  0,
              });

            await user.save({
              session,
            });

            const profile =
              new InstructorProfile({
                userId:
                  user._id,

                headline:
                  input.headline,

                qualification:
                  input.qualification,

                experienceYears:
                  input.experienceYears,

                expertise:
                  input.expertise,

                biography:
                  input.biography,
              });

            await profile.save({
              session,
            });

            return {
              user,
              profile,
            };
          },
        );

      if (!transactionResult) {
        throw new AppError(
          'Instructor registration could not be completed',
          500,
          'INSTRUCTOR_REGISTRATION_FAILED',
        );
      }

      await sendRegistrationVerificationOtp(
        transactionResult.user,
      );

      return {
        user:
          sanitizeUser(
            transactionResult.user,
          ),

        profile:
          toInstructorProfileResponse(
            transactionResult.profile,
          ),

        verificationRequired:
          true as const,
      };
    } catch (error) {
      if (
        isDuplicateKeyError(error)
      ) {
        throw new AppError(
          'A user with this email address already exists',
          409,
          'EMAIL_ALREADY_EXISTS',
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }
  };

export const verifyUserEmail =
  async (
    input: VerifyEmailInput,
    metadata: SessionMetadata,
  ) => {
    const user =
      await User
        .findOne({
          email: input.email,
        })
        .select(
          '+tokenVersion',
        );

    if (!user) {
      throw new AppError(
        'The OTP is invalid or has expired',
        400,
        'INVALID_OR_EXPIRED_OTP',
      );
    }

    assertActiveAccount(
      user.status,
    );

    if (
      user.emailVerified
    ) {
      throw new AppError(
        'This email address has already been verified',
        409,
        'EMAIL_ALREADY_VERIFIED',
      );
    }

    await verifyAndConsumeOtp(
      user.email,
      OTP_PURPOSES.EMAIL_VERIFICATION,
      input.otp,
    );

    user.emailVerified =
      true;

    user.lastLoginAt =
      new Date();

    await user.save();

    const tokens =
      await createTokenPair(
        user,
        metadata,
      );

    return {
      user:
        sanitizeUser(user),

      tokens,
    };
  };

export const resendVerificationOtp =
  async (
    input: ResendVerificationOtpInput,
  ): Promise<void> => {
    const user =
      await User.findOne({
        email: input.email,
      });

    if (!user) {
      throw new AppError(
        'No account was found for this email address',
        404,
        'USER_NOT_FOUND',
      );
    }

    assertActiveAccount(
      user.status,
    );

    if (
      user.emailVerified
    ) {
      throw new AppError(
        'This email address has already been verified',
        409,
        'EMAIL_ALREADY_VERIFIED',
      );
    }

    const otp =
      await issueOtp(
        user.email,
        OTP_PURPOSES.EMAIL_VERIFICATION,
      );

    try {
      await sendVerificationOtpEmail(
        user.email,
        user.firstName,
        otp,
      );
    } catch (error) {
      await removeOtp(
        user.email,
        OTP_PURPOSES.EMAIL_VERIFICATION,
      );

      throw error;
    }
  };

export const loginUser =
  async (
    input: LoginInput,
    metadata: SessionMetadata,
  ) => {
    const user =
      await User
        .findOne({
          email: input.email,
        })
        .select(
          '+passwordHash +tokenVersion',
        );

    if (
      !user?.passwordHash
    ) {
      throw new AppError(
        'The email address or password is incorrect',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        input.password,
        user.passwordHash,
      );

    if (
      !passwordMatches
    ) {
      throw new AppError(
        'The email address or password is incorrect',
        401,
        'INVALID_CREDENTIALS',
      );
    }

    assertActiveAccount(
      user.status,
    );

    if (
      !user.emailVerified
    ) {
      throw new AppError(
        'Please verify your email address before signing in',
        403,
        'EMAIL_NOT_VERIFIED',
      );
    }

    user.lastLoginAt =
      new Date();

    await user.save();

    const tokens =
      await createTokenPair(
        user,
        metadata,
      );

    return {
      user:
        sanitizeUser(user),

      tokens,
    };
  };

export const refreshAuthentication =
  async (
    refreshToken: string,
    metadata: SessionMetadata,
  ) => {
    const result =
      await rotateRefreshToken(
        refreshToken,
        metadata,
      );

    return {
      user:
        sanitizeUser(
          result.user,
        ),

      tokens:
        result.tokens,
    };
  };

export const requestPasswordReset =
  async (
    input: ForgotPasswordInput,
  ): Promise<void> => {
    const user =
      await User.findOne({
        email: input.email,
      });

    /*
     * Return the same result when no account exists.
     * This prevents email-address enumeration.
     */
    if (
      !user ||
      user.status !==
        USER_STATUSES.ACTIVE
    ) {
      return;
    }

    const otp =
      await issueOtp(
        user.email,
        OTP_PURPOSES.PASSWORD_RESET,
      );

    try {
      await sendPasswordResetOtpEmail(
        user.email,
        user.firstName,
        otp,
      );
    } catch (error) {
      await removeOtp(
        user.email,
        OTP_PURPOSES.PASSWORD_RESET,
      );

      throw error;
    }
  };

export const verifyPasswordResetOtp =
  async (
    input: VerifyPasswordResetOtpInput,
  ): Promise<{
    resetToken: string;
  }> => {
    const user =
      await User
        .findOne({
          email: input.email,
        })
        .select(
          '+tokenVersion',
        );

    if (
      !user ||
      user.status !==
        USER_STATUSES.ACTIVE
    ) {
      throw new AppError(
        'The OTP is invalid or has expired',
        400,
        'INVALID_OR_EXPIRED_OTP',
      );
    }

    await verifyAndConsumeOtp(
      user.email,
      OTP_PURPOSES.PASSWORD_RESET,
      input.otp,
    );

    return {
      resetToken:
        createPasswordResetToken(
          user,
        ),
    };
  };

export const resetUserPassword =
  async (
    input: ResetPasswordInput,
  ): Promise<void> => {
    const payload =
      verifyPasswordResetToken(
        input.resetToken,
      );

    const user =
      await User
        .findById(
          payload.sub,
        )
        .select(
          '+passwordHash +tokenVersion',
        );

    if (
      !user ||
      user.status !==
        USER_STATUSES.ACTIVE ||
      user.tokenVersion !==
        payload.tokenVersion
    ) {
      throw new AppError(
        'The password reset token is invalid or has already been used',
        401,
        'INVALID_PASSWORD_RESET_TOKEN',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        input.newPassword,
        user.passwordHash,
      );

    if (passwordMatches) {
      throw new AppError(
        'The new password must be different from the previous password',
        409,
        'PASSWORD_REUSE_NOT_ALLOWED',
      );
    }

    user.passwordHash =
      await bcrypt.hash(
        input.newPassword,
        environment.BCRYPT_ROUNDS,
      );

    user.emailVerified =
      true;

    /*
     * Invalidates previously issued access tokens.
     */
    user.tokenVersion += 1;

    await user.save();

    await revokeAllUserSessions(
      user.id,
    );
  };

export const logoutCurrentSession =
  async (
    userId: string,
    sessionId: string,
  ): Promise<void> => {
    await revokeSession(
      sessionId,
      userId,
    );
  };

export const logoutEverySession =
  async (
    userId: string,
  ): Promise<void> => {
    await revokeAllUserSessions(
      userId,
    );
  };