import type {
  OtpPurpose,
} from '../constants/auth.constants';

import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';
import { OtpCode } from '../models/otpCode.model';
import { generateOtp } from '../utils/generateOtp';

import {
  hashOtp,
  safeHashEquals,
} from '../utils/hashValue';

export const issueOtp = async (
  email: string,
  purpose: OtpPurpose,
): Promise<string> => {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const existingOtp =
    await OtpCode.findOne({
      email:
        normalizedEmail,

      purpose,
    });

  if (existingOtp) {
    const secondsSinceLastSend =
      Math.floor(
        (
          Date.now() -
          existingOtp
            .updatedAt
            .getTime()
        ) / 1000,
      );

    if (
      secondsSinceLastSend <
      environment
        .OTP_RESEND_COOLDOWN_SECONDS
    ) {
      const retryAfter =
        environment
          .OTP_RESEND_COOLDOWN_SECONDS -
        secondsSinceLastSend;

      throw new AppError(
        `Please wait ${retryAfter} seconds before requesting another OTP`,
        429,
        'OTP_RESEND_COOLDOWN',
        {
          retryAfterSeconds:
            retryAfter,
        },
      );
    }
  }

  const otp =
    generateOtp();

  const expiresAt =
    new Date(
      Date.now() +
      environment
        .OTP_EXPIRY_MINUTES *
      60 *
      1000,
    );

  await OtpCode
    .findOneAndUpdate(
      {
        email:
          normalizedEmail,

        purpose,
      },

      {
        $set: {
          codeHash:
            hashOtp(otp),

          attempts:
            0,

          expiresAt,
        },
      },

      {
        upsert:
          true,

        new:
          true,

        setDefaultsOnInsert:
          true,
      },
    );

  return otp;
};

export const verifyAndConsumeOtp =
  async (
    email: string,
    purpose: OtpPurpose,
    otp: string,
  ): Promise<void> => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const otpRecord =
      await OtpCode
        .findOne({
          email:
            normalizedEmail,

          purpose,
        })
        .select(
          '+codeHash',
        );

    if (
      !otpRecord ||
      otpRecord
        .expiresAt
        .getTime() <= Date.now()
    ) {
      if (otpRecord) {
        await otpRecord
          .deleteOne();
      }

      throw new AppError(
        'The OTP is invalid or has expired',
        400,
        'INVALID_OR_EXPIRED_OTP',
      );
    }

    if (
      otpRecord.attempts >=
      environment
        .OTP_MAX_ATTEMPTS
    ) {
      await otpRecord
        .deleteOne();

      throw new AppError(
        'The maximum number of OTP attempts has been exceeded',
        429,
        'OTP_ATTEMPTS_EXCEEDED',
      );
    }

    const matches =
      safeHashEquals(
        otpRecord.codeHash,
        hashOtp(otp),
      );

    if (!matches) {
      otpRecord.attempts += 1;

      if (
        otpRecord.attempts >=
        environment
          .OTP_MAX_ATTEMPTS
      ) {
        await otpRecord
          .deleteOne();
      } else {
        await otpRecord
          .save();
      }

      throw new AppError(
        'The OTP is invalid or has expired',
        400,
        'INVALID_OR_EXPIRED_OTP',
      );
    }

    await otpRecord
      .deleteOne();
  };

export const removeOtp = async (
  email: string,
  purpose: OtpPurpose,
): Promise<void> => {
  await OtpCode.deleteOne({
    email:
      email
        .trim()
        .toLowerCase(),

    purpose,
  });
};