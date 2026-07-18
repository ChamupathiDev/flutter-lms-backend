import 'dotenv/config';

import { z } from 'zod';

const booleanFromEnvironment =
  z.preprocess(
    (value) => {
      if (
        typeof value ===
        'boolean'
      ) {
        return value;
      }

      if (
        typeof value ===
        'string'
      ) {
        return value
          .trim()
          .toLowerCase() ===
          'true';
      }

      return value;
    },

    z.boolean(),
  );

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum([
        'development',
        'test',
        'production',
      ])
      .default(
        'development',
      ),

    PORT: z.coerce
      .number()
      .int()
      .positive()
      .max(65535)
      .default(5000),

    API_PREFIX: z
      .string()
      .trim()
      .min(1)
      .default(
        '/api/v1',
      ),

    MONGODB_URI: z
      .string()
      .trim()
      .min(
        1,
        'MONGODB_URI is required',
      )
      .refine(
        (value) =>
          value.startsWith(
            'mongodb+srv://',
          ) ||
          value.startsWith(
            'mongodb://',
          ),
        {
          message:
            'MONGODB_URI must start with mongodb+srv:// or mongodb://',
        },
      ),

    MONGODB_DB_NAME: z
      .string()
      .trim()
      .min(1)
      .default(
        'flutter_lms',
      ),

    MONGODB_MAX_POOL_SIZE:
      z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(10),

    CORS_ORIGINS: z
      .string()
      .default('*'),

    LOG_LEVEL: z
      .enum([
        'fatal',
        'error',
        'warn',
        'info',
        'debug',
        'trace',
        'silent',
      ])
      .default('info'),

    SHUTDOWN_TIMEOUT_MS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(10000),

    BCRYPT_ROUNDS: z.coerce
      .number()
      .int()
      .min(10)
      .max(15)
      .default(12),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32),

    JWT_REFRESH_SECRET: z
      .string()
      .min(32),

    JWT_PASSWORD_RESET_SECRET:
      z
        .string()
        .min(32),

    JWT_ISSUER: z
      .string()
      .trim()
      .min(1)
      .default(
        'flutter-lms-backend',
      ),

    JWT_AUDIENCE: z
      .string()
      .trim()
      .min(1)
      .default(
        'flutter-lms-mobile',
      ),

    JWT_ACCESS_EXPIRES_IN:
      z
        .string()
        .trim()
        .min(1)
        .default('15m'),

    JWT_REFRESH_EXPIRES_IN:
      z
        .string()
        .trim()
        .min(1)
        .default('30d'),

    JWT_PASSWORD_RESET_EXPIRES_IN:
      z
        .string()
        .trim()
        .min(1)
        .default('10m'),

    OTP_PEPPER: z
      .string()
      .min(32),

    OTP_EXPIRY_MINUTES:
      z.coerce
        .number()
        .int()
        .min(2)
        .max(30)
        .default(10),

    OTP_MAX_ATTEMPTS:
      z.coerce
        .number()
        .int()
        .min(3)
        .max(10)
        .default(5),

    OTP_RESEND_COOLDOWN_SECONDS:
      z.coerce
        .number()
        .int()
        .min(30)
        .max(600)
        .default(60),

    EMAIL_ENABLED:
      booleanFromEnvironment
        .default(false),

    SMTP_HOST: z
      .string()
      .trim()
      .optional(),

    SMTP_PORT: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    SMTP_SECURE:
      booleanFromEnvironment
        .default(false),

    SMTP_USER: z
      .string()
      .trim()
      .optional(),

    SMTP_PASS: z
      .string()
      .optional(),

    EMAIL_FROM_NAME: z
      .string()
      .trim()
      .default(
        'Flutter LMS',
      ),

    EMAIL_FROM_ADDRESS: z
      .string()
      .email()
      .optional(),

    CLOUDINARY_ENABLED:
      booleanFromEnvironment
        .default(false),

    CLOUDINARY_CLOUD_NAME:
      z
        .string()
        .trim()
        .optional(),

    CLOUDINARY_API_KEY: z
      .string()
      .trim()
      .optional(),

    CLOUDINARY_API_SECRET:
      z
        .string()
        .trim()
        .optional(),

    CLOUDINARY_FOLDER: z
      .string()
      .trim()
      .default(
        'flutter-lms',
      ),

    PROFILE_IMAGE_MAX_MB:
      z.coerce
        .number()
        .int()
        .positive()
        .max(10)
        .default(5),

    ADMIN_SEED_FIRST_NAME:
      z
        .string()
        .trim()
        .optional(),

    ADMIN_SEED_LAST_NAME:
      z
        .string()
        .trim()
        .optional(),

    ADMIN_SEED_EMAIL: z
      .string()
      .email()
      .optional(),

    ADMIN_SEED_PASSWORD:
      z
        .string()
        .min(8)
        .optional(),
  })
  .superRefine(
    (
      values,
      context,
    ) => {
      if (
        values.EMAIL_ENABLED
      ) {
        const requiredFields:
          Array<
            keyof typeof values
          > = [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
            'EMAIL_FROM_ADDRESS',
          ];

        for (
          const field
          of requiredFields
        ) {
          if (
            !values[field]
          ) {
            context.addIssue({
              code:
                'custom',

              path:
                [field],

              message:
                `${field} is required when EMAIL_ENABLED=true`,
            });
          }
        }
      }

      if (
        values
          .CLOUDINARY_ENABLED
      ) {
        const requiredFields:
          Array<
            keyof typeof values
          > = [
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET',
          ];

        for (
          const field
          of requiredFields
        ) {
          if (
            !values[field]
          ) {
            context.addIssue({
              code:
                'custom',

              path:
                [field],

              message:
                `${field} is required when CLOUDINARY_ENABLED=true`,
            });
          }
        }
      }
    },
  );

const parsedEnvironment =
  environmentSchema.safeParse(
    process.env,
  );

if (
  !parsedEnvironment.success
) {
  const readableErrors =
    parsedEnvironment.error
      .issues
      .map(
        (issue) =>
          `${issue.path.join('.') || 'environment'}: ${issue.message}`,
      )
      .join(', ');

  throw new Error(
    `Invalid environment configuration: ${readableErrors}`,
  );
}

const apiPrefix =
  parsedEnvironment.data
    .API_PREFIX
    .startsWith('/')
    ? parsedEnvironment.data
        .API_PREFIX
    : `/${parsedEnvironment.data.API_PREFIX}`;

export const environment = {
  ...parsedEnvironment.data,

  API_PREFIX:
    apiPrefix.replace(
      /\/$/,
      '',
    ),

  CORS_ORIGINS:
    parsedEnvironment.data
      .CORS_ORIGINS
      .split(',')
      .map(
        (origin) =>
          origin.trim(),
      )
      .filter(Boolean),
};