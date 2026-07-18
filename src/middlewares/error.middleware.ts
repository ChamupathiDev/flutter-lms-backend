import type {
  ErrorRequestHandler,
} from 'express';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';

import {
  ZodError,
} from 'zod';

import { environment } from '../config/environment';
import { logger } from '../config/logger';
import { AppError } from '../errors/AppError';

import type {
  ErrorResponse,
} from '../utils/apiResponse';

interface MongoDuplicateKeyError
  extends Error {
  code: number;

  keyPattern?:
    Record<
      string,
      number
    >;
}

const isMongoDuplicateKeyError = (
  error: unknown,
): error is MongoDuplicateKeyError =>
  error instanceof Error &&
  'code' in error &&
  (
    error as
      MongoDuplicateKeyError
  ).code === 11000;

export const globalErrorHandler:
  ErrorRequestHandler =
    (
      error:
        unknown,

      request,
      response,
      _next,
    ) => {
      let appError:
        AppError;

      if (
        error instanceof
        AppError
      ) {
        appError =
          error;
      } else if (
        error instanceof
        ZodError
      ) {
        appError =
          new AppError(
            'Request validation failed',
            422,
            'VALIDATION_ERROR',

            error.issues.map(
              (issue) => ({
                field:
                  issue
                    .path
                    .join('.'),

                message:
                  issue.message,
              }),
            ),
          );
      } else if (
        error instanceof
        multer.MulterError
      ) {
        if (
          error.code ===
          'LIMIT_FILE_SIZE'
        ) {
          appError =
            new AppError(
              'The uploaded file exceeds the allowed size',
              413,
              'FILE_TOO_LARGE',
            );
        } else {
          appError =
            new AppError(
              'The uploaded file could not be processed',
              400,
              'FILE_UPLOAD_ERROR',
            );
        }
      } else if (
        error instanceof
        mongoose
          .Error
          .CastError
      ) {
        appError =
          new AppError(
            'The supplied resource identifier is invalid',
            400,
            'INVALID_RESOURCE_ID',
          );
      } else if (
        error instanceof
        mongoose
          .Error
          .ValidationError
      ) {
        appError =
          new AppError(
            'Database validation failed',
            422,
            'DATABASE_VALIDATION_ERROR',

            Object
              .values(
                error.errors,
              )
              .map(
                (
                  validationError,
                ) => ({
                  field:
                    validationError
                      .path,

                  message:
                    validationError
                      .message,
                }),
              ),
          );
      } else if (
        isMongoDuplicateKeyError(
          error,
        )
      ) {
        const field =
          Object.keys(
            error.keyPattern ??
              {},
          )[0] ??
          'value';

        appError =
          new AppError(
            `A resource with this ${field} already exists`,
            409,
            'DUPLICATE_RESOURCE',

            {
              field,
            },
          );
      } else if (
        error instanceof
        jwt.TokenExpiredError
      ) {
        appError =
          new AppError(
            'The supplied token has expired',
            401,
            'TOKEN_EXPIRED',
          );
      } else if (
        error instanceof
        jwt.JsonWebTokenError
      ) {
        appError =
          new AppError(
            'The supplied token is invalid',
            401,
            'INVALID_TOKEN',
          );
      } else {
        appError =
          new AppError(
            'An unexpected server error occurred',
            500,
            'INTERNAL_SERVER_ERROR',
          );
      }

      const logPayload = {
        err:
          error,

        method:
          request.method,

        path:
          request.originalUrl,

        statusCode:
          appError.statusCode,

        errorCode:
          appError.errorCode,
      };

      if (
        appError.statusCode >=
        500
      ) {
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

      const body:
        ErrorResponse & {
          stack?: string;
        } = {
          success:
            false,

          message:
            appError.message,

          errorCode:
            appError.errorCode,
        };

      if (
        appError.details !==
        undefined
      ) {
        body.details =
          appError.details;
      }

      if (
        environment.NODE_ENV ===
        'development'
      ) {
        body.stack =
          error instanceof Error
            ? error.stack
            : undefined;
      }

      response
        .status(
          appError.statusCode,
        )
        .json(body);
    };