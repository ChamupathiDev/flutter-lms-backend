import nodemailer, {
  type Transporter,
} from 'nodemailer';

import { environment } from '../config/environment';
import { logger } from '../config/logger';
import { AppError } from '../errors/AppError';

import {
  buildEmailVerificationTemplate,
} from '../templates/emailVerification.template';

import {
  buildPasswordResetTemplate,
} from '../templates/passwordReset.template';

let transporter:
  Transporter | undefined;

const getTransporter = ():
  Transporter => {
  if (
    !environment.EMAIL_ENABLED
  ) {
    throw new AppError(
      'Email delivery is not configured',
      503,
      'EMAIL_SERVICE_UNAVAILABLE',
    );
  }

  transporter ??=
    nodemailer.createTransport({
      host:
        environment.SMTP_HOST,

      port:
        environment.SMTP_PORT,

      secure:
        environment.SMTP_SECURE,

      auth: {
        user:
          environment.SMTP_USER,

        pass:
          environment.SMTP_PASS,
      },
    });

  return transporter;
};

const sendEmail = async (
  to: string,

  message: {
    subject: string;
    text: string;
    html: string;
  },
): Promise<void> => {
  const mailTransporter =
    getTransporter();

  try {
    await mailTransporter
      .sendMail({
        from: {
          name:
            environment
              .EMAIL_FROM_NAME,

          address:
            environment
              .EMAIL_FROM_ADDRESS!,
        },

        to,

        subject:
          message.subject,

        text:
          message.text,

        html:
          message.html,
      });
  } catch (error) {
    logger.error(
      {
        err: error,
        to,
      },

      'Email delivery failed',
    );

    throw new AppError(
      'The email could not be sent. Please try again later.',
      503,
      'EMAIL_DELIVERY_FAILED',
    );
  }
};

const deliverOtp = async (
  email: string,
  firstName: string,
  otp: string,

  type:
    | 'verification'
    | 'password-reset',
): Promise<void> => {
  if (
    !environment.EMAIL_ENABLED
  ) {
    if (
      environment.NODE_ENV ===
      'production'
    ) {
      throw new AppError(
        'Email delivery is not configured',
        503,
        'EMAIL_SERVICE_UNAVAILABLE',
      );
    }

    logger.warn(
      {
        email,
        otpType: type,
        developmentOtp: otp,
      },

      'Email is disabled; OTP logged for development testing',
    );

    return;
  }

  const message =
    type === 'verification'
      ? buildEmailVerificationTemplate(
          firstName,
          otp,
          environment
            .OTP_EXPIRY_MINUTES,
        )
      : buildPasswordResetTemplate(
          firstName,
          otp,
          environment
            .OTP_EXPIRY_MINUTES,
        );

  await sendEmail(
    email,
    message,
  );
};

export const sendVerificationOtpEmail =
  async (
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> => {
    await deliverOtp(
      email,
      firstName,
      otp,
      'verification',
    );
  };

export const sendPasswordResetOtpEmail =
  async (
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> => {
    await deliverOtp(
      email,
      firstName,
      otp,
      'password-reset',
    );
  };

export const verifyEmailConfiguration =
  async (): Promise<void> => {
    if (
      !environment.EMAIL_ENABLED
    ) {
      logger.warn(
        'Email delivery is disabled; development OTPs will be written to logs',
      );

      return;
    }

    try {
      await getTransporter()
        .verify();

      logger.info(
        'SMTP email service connected',
      );
    } catch (error) {
      logger.error(
        {
          err: error,
        },

        'SMTP configuration verification failed',
      );

      throw error;
    }
  };