import type {
  RequestHandler,
} from 'express';

import type {
  ZodType,
} from 'zod';

import { AppError } from '../errors/AppError';

interface RequestValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validateRequest = (
  schemas:
    RequestValidationSchemas,
): RequestHandler => {
  return (
    request,
    _response,
    next,
  ) => {
    const validated =
      request.validated ?? {};

    for (
      const location of [
        'body',
        'params',
        'query',
      ] as const
    ) {
      const schema =
        schemas[location];

      if (!schema) {
        continue;
      }

      const result =
        schema.safeParse(
          request[location],
        );

      if (!result.success) {
        next(
          new AppError(
            'Request validation failed',
            422,
            'VALIDATION_ERROR',

            result.error.issues.map(
              (issue) => ({
                field: [
                  location,
                  ...issue.path,
                ].join('.'),

                message:
                  issue.message,
              }),
            ),
          ),
        );

        return;
      }

      validated[location] =
        result.data;
    }

    request.validated =
      validated;

    next();
  };
};