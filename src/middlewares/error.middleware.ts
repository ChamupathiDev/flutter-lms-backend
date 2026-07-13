import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { environment } from '../config/environment';
import { logger } from '../config/logger';
import { AppError } from '../errors/AppError';
import type { ErrorResponse } from '../utils/apiResponse';

interface MongoDuplicateKeyError
  extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isMongoDuplicateKeyError = (
  error: unknown,
): error is MongoDuplicateKeyError => {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as MongoDuplicateKeyError)
      .code === 11000
  );
};

export const globalErrorHandler: ErrorRequestHandler =
  (
    error: unknown,
    request,
    response,
    _next,
  ) => {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof ZodError) {
      appError = new AppError(
        'Request validation failed',
        422,
        'VALIDATION_ERROR',
        error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    } else if (
      error instanceof
      mongoose.Error.CastError
    ) {
      appError = new AppError(
        'The supplied resource identifier is invalid',
        400,
        'INVALID_RESOURCE_ID',
      );
    } else if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      const details = Object.values(
        error.errors,
      ).map((validationError) => ({
        field: validationError.path,
        message: validationError.message,
      }));

      appError = new AppError(
        'Database validation failed',
        422,
        'DATABASE_VALIDATION_ERROR',
        details,
      );
    } else if (
      isMongoDuplicateKeyError(error)
    ) {
      appError = new AppError(
        'A resource with the supplied unique value already exists',
        409,
        'DUPLICATE_RESOURCE',
        error.keyValue,
      );
    } else {
      appError = new AppError(
        'An unexpected server error occurred',
        500,
        'INTERNAL_SERVER_ERROR',
      );
    }

    const logPayload = {
      err: error,
      method: request.method,
      path: request.originalUrl,
      statusCode: appError.statusCode,
      errorCode: appError.errorCode,
    };

    if (appError.statusCode >= 500) {
      logger.error(
        logPayload,
        appError.message,
      );
    } else {
      logger.warn(
        logPayload,
        appError.message,
      );
    }

    const responseBody:
      ErrorResponse & {
        stack?: string;
      } = {
        success: false,
        message: appError.message,
        errorCode: appError.errorCode,
      };

    if (
      appError.details !== undefined
    ) {
      responseBody.details =
        appError.details;
    }

    if (
      environment.NODE_ENV ===
      'development'
    ) {
      responseBody.stack =
        error instanceof Error
          ? error.stack
          : undefined;
    }

    response
      .status(appError.statusCode)
      .json(responseBody);
  };