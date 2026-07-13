import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { createSuccessResponse } from '../utils/apiResponse';

const databaseStates: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getHealth: RequestHandler = (
  _request,
  response,
) => {
  const databaseState =
    databaseStates[
      mongoose.connection.readyState
    ] ?? 'unknown';

  response.status(200).json(
    createSuccessResponse(
      'LMS backend is running',
      {
        service: 'flutter-lms-backend',

        timestamp: new Date().toISOString(),

        uptimeSeconds: Math.floor(
          process.uptime(),
        ),

        database: {
          provider: 'MongoDB Atlas',
          status: databaseState,
          name:
            mongoose.connection.name ||
            null,
        },
      },
    ),
  );
};

export const getLiveness: RequestHandler = (
  _request,
  response,
) => {
  response.status(200).json(
    createSuccessResponse(
      'Application process is alive',
      {
        timestamp: new Date().toISOString(),
      },
    ),
  );
};

export const getReadiness: RequestHandler = (
  _request,
  response,
) => {
  const isDatabaseReady =
    mongoose.connection.readyState === 1;

  response
    .status(isDatabaseReady ? 200 : 503)
    .json({
      success: isDatabaseReady,

      message: isDatabaseReady
        ? 'Application is ready to receive requests'
        : 'Application is not ready because MongoDB Atlas is unavailable',

      data: {
        database: {
          provider: 'MongoDB Atlas',

          status: isDatabaseReady
            ? 'connected'
            : 'disconnected',

          name:
            mongoose.connection.name ||
            null,
        },

        timestamp:
          new Date().toISOString(),
      },
    });
};