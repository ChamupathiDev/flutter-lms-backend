import compression from 'compression';
import cors, {
  type CorsOptions,
} from 'cors';
import express, {
  type Express,
} from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { environment } from './config/environment';
import { logger } from './config/logger';
import { AppError } from './errors/AppError';
import { globalErrorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import apiRouter from './routes';
import { createSuccessResponse } from './utils/apiResponse';

const app: Express = express();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const originIsAllowed =
      !origin ||
      environment.CORS_ORIGINS.includes(
        '*',
      ) ||
      environment.CORS_ORIGINS.includes(
        origin,
      );

    if (originIsAllowed) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        'This origin is not allowed to access the API',
        403,
        'CORS_ORIGIN_DENIED',
      ),
    );
  },

  credentials: false,
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 200,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests. Please try again later.',
    errorCode:
      'RATE_LIMIT_EXCEEDED',
  },
});

app.disable('x-powered-by');

app.use(
  pinoHttp({
    logger,
  }),
);

app.use(helmet());

app.use(cors(corsOptions));

app.use(compression());

app.use(
  express.json({
    limit: '1mb',
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  }),
);

app.get(
  '/',
  (_request, response) => {
    response.status(200).json(
      createSuccessResponse(
        'Welcome to the Flutter LMS backend API',
        {
          apiPrefix:
            environment.API_PREFIX,

          healthEndpoint:
            `${environment.API_PREFIX}/health`,

          databaseProvider:
            'MongoDB Atlas',
        },
      ),
    );
  },
);

app.use(
  environment.API_PREFIX,
  apiLimiter,
  apiRouter,
);

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;