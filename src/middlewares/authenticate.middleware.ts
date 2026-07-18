import {
  USER_STATUSES,
} from '../constants/user.constants';

import { AppError } from '../errors/AppError';

import {
  RefreshSession,
} from '../models/refreshSession.model';

import {
  User,
} from '../models/user.model';

import {
  verifyAccessToken,
} from '../services/token.service';

import {
  asyncHandler,
} from '../utils/asyncHandler';

export const authenticate =
  asyncHandler(
    async (
      request,
      _response,
      next,
    ) => {
      const authorizationHeader =
        request
          .headers
          .authorization;

      if (
        !authorizationHeader
          ?.startsWith(
            'Bearer ',
          )
      ) {
        throw new AppError(
          'A Bearer access token is required',
          401,
          'AUTHENTICATION_REQUIRED',
        );
      }

      const accessToken =
        authorizationHeader
          .slice(7)
          .trim();

      const payload =
        verifyAccessToken(
          accessToken,
        );

      const [
        user,
        session,
      ] = await Promise.all([
        User
          .findById(
            payload.sub,
          )
          .select(
            '+tokenVersion',
          ),

        RefreshSession
          .findById(
            payload.sid,
          ),
      ]);

      if (!user) {
        throw new AppError(
          'The authenticated user no longer exists',
          401,
          'AUTHENTICATED_USER_NOT_FOUND',
        );
      }

      if (
        user.status !==
        USER_STATUSES.ACTIVE
      ) {
        throw new AppError(
          'This user account is not active',
          403,
          'USER_ACCOUNT_NOT_ACTIVE',
        );
      }

      if (
        !user.emailVerified
      ) {
        throw new AppError(
          'Email verification is required',
          403,
          'EMAIL_NOT_VERIFIED',
        );
      }

      if (
        user.tokenVersion !==
        payload.tokenVersion
      ) {
        throw new AppError(
          'The access token has been invalidated',
          401,
          'ACCESS_TOKEN_INVALIDATED',
        );
      }

      if (
        !session ||
        session.revokedAt ||
        session
          .expiresAt
          .getTime() <=
          Date.now() ||
        session
          .userId
          .toString() !==
          user.id
      ) {
        throw new AppError(
          'The authenticated session is no longer active',
          401,
          'AUTHENTICATED_SESSION_INACTIVE',
        );
      }

      request.auth = {
        userId:
          user.id,

        sessionId:
          session.id,

        email:
          user.email,

        role:
          user.role,
      };

      next();
    },
  );