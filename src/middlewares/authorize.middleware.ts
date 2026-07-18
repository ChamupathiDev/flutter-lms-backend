import type {
  RequestHandler,
} from 'express';

import type {
  UserRole,
} from '../constants/user.constants';

import { AppError } from '../errors/AppError';

export const authorize = (
  ...allowedRoles:
    UserRole[]
): RequestHandler => {
  return (
    request,
    _response,
    next,
  ) => {
    if (!request.auth) {
      next(
        new AppError(
          'Authentication is required',
          401,
          'AUTHENTICATION_REQUIRED',
        ),
      );

      return;
    }

    if (
      !allowedRoles.includes(
        request.auth.role,
      )
    ) {
      next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'INSUFFICIENT_PERMISSION',
        ),
      );

      return;
    }

    next();
  };
};