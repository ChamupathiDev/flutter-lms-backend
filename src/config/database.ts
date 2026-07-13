import mongoose from 'mongoose';
import { environment } from './environment';
import { logger } from './logger';

mongoose.set('strictQuery', true);

export const connectToDatabase =
  async (): Promise<void> => {
    try {
      await mongoose.connect(
        environment.MONGODB_URI,
        {
          dbName: environment.MONGODB_DB_NAME,

          serverSelectionTimeoutMS: 10000,

          minPoolSize: 0,

          maxPoolSize:
            environment.MONGODB_MAX_POOL_SIZE,
        },
      );

      logger.info(
        {
          database: mongoose.connection.name,
          host: mongoose.connection.host,
          readyState:
            mongoose.connection.readyState,
        },
        'MongoDB Atlas connected',
      );
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        'MongoDB Atlas connection failed',
      );

      throw error;
    }
  };

export const disconnectFromDatabase =
  async (): Promise<void> => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();

      logger.info(
        'MongoDB Atlas disconnected',
      );
    }
  };