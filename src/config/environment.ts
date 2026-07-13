import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

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
    .default('/api/v1'),

  MONGODB_URI: z
    .string()
    .trim()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (value) =>
        value.startsWith('mongodb+srv://') ||
        value.startsWith('mongodb://'),
      {
        message:
          'MONGODB_URI must start with mongodb+srv:// or mongodb://',
      },
    ),

  MONGODB_DB_NAME: z
    .string()
    .trim()
    .min(1, 'MONGODB_DB_NAME is required')
    .default('flutter_lms'),

  MONGODB_MAX_POOL_SIZE: z.coerce
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

  SHUTDOWN_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10000),
});

const parsedEnvironment = environmentSchema.safeParse(
  process.env,
);

if (!parsedEnvironment.success) {
  const readableErrors =
    parsedEnvironment.error.issues
      .map((issue) => {
        const fieldName = issue.path.join('.');

        return `${fieldName}: ${issue.message}`;
      })
      .join(', ');

  throw new Error(
    `Invalid environment configuration: ${readableErrors}`,
  );
}

const apiPrefix =
  parsedEnvironment.data.API_PREFIX.startsWith('/')
    ? parsedEnvironment.data.API_PREFIX
    : `/${parsedEnvironment.data.API_PREFIX}`;

export const environment = {
  ...parsedEnvironment.data,

  API_PREFIX: apiPrefix.replace(/\/$/, ''),

  CORS_ORIGINS:
    parsedEnvironment.data.CORS_ORIGINS
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
};