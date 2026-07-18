import type {
  Request,
} from 'express';

import { AppError } from '../errors/AppError';

export const getValidatedBody = <T>(
  request: Request,
): T =>
  request.validated?.body as T;

export const getValidatedParams = <T>(
  request: Request,
): T =>
  request.validated?.params as T;

export const getValidatedQuery = <T>(
  request: Request,
): T =>
  request.validated?.query as T;

export const requireAuth = (
  request: Request,
) => {
  if (!request.auth) {
    throw new AppError(
      'Authentication is required',
      401,
      'AUTHENTICATION_REQUIRED',
    );
  }

  return request.auth;
};