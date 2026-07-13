import pino from 'pino';
import { environment } from './environment';

const transport =
  environment.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined;

export const logger = pino(
  {
    level: environment.LOG_LEVEL,

    base: {
      service: 'flutter-lms-backend',
      environment: environment.NODE_ENV,
    },

    redact: {
      paths: [
        'req.headers.authorization',
        'req.body.password',
        'req.body.confirmPassword',
        'req.body.refreshToken',
      ],
      censor: '[REDACTED]',
    },
  },
  transport,
);