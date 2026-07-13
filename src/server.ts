import type { Server } from 'node:http';
import app from './app';
import {
  connectToDatabase,
  disconnectFromDatabase,
} from './config/database';
import { environment } from './config/environment';
import { logger } from './config/logger';

let httpServer: Server | undefined;

let shutdownInProgress = false;

const startServer =
  async (): Promise<void> => {
    await connectToDatabase();

    httpServer = app.listen(
      environment.PORT,
      '0.0.0.0',
      () => {
        logger.info(
          {
            port: environment.PORT,

            apiPrefix:
              environment.API_PREFIX,

            databaseProvider:
              'MongoDB Atlas',
          },
          'LMS backend started',
        );
      },
    );
  };

const shutdown = async (
  signal: NodeJS.Signals,
): Promise<void> => {
  if (shutdownInProgress) {
    return;
  }

  shutdownInProgress = true;

  logger.info(
    {
      signal,
    },
    'Graceful shutdown started',
  );

  const forceShutdownTimer =
    setTimeout(() => {
      logger.fatal(
        'Graceful shutdown timed out. Forcing process exit.',
      );

      process.exit(1);
    }, environment.SHUTDOWN_TIMEOUT_MS);

  forceShutdownTimer.unref();

  try {
    if (httpServer) {
      await new Promise<void>(
        (resolve, reject) => {
          httpServer?.close(
            (error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            },
          );
        },
      );
    }

    await disconnectFromDatabase();

    clearTimeout(forceShutdownTimer);

    logger.info(
      'Graceful shutdown completed',
    );

    process.exit(0);
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      'Graceful shutdown failed',
    );

    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on(
  'unhandledRejection',
  (reason) => {
    logger.fatal(
      {
        err: reason,
      },
      'Unhandled promise rejection',
    );

    void shutdown('SIGTERM');
  },
);

process.on(
  'uncaughtException',
  (error) => {
    logger.fatal(
      {
        err: error,
      },
      'Uncaught exception',
    );

    void shutdown('SIGTERM');
  },
);

void startServer().catch(
  (error) => {
    logger.fatal(
      {
        err: error,
      },
      'Application startup failed',
    );

    process.exit(1);
  },
);