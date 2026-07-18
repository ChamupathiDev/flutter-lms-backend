import type {
  Request,
  RequestHandler,
} from 'express';

import { AppError } from '../errors/AppError';

import {
  changeCurrentUserPassword,
  deactivateCurrentUser,
  getCurrentFullProfile,
  getCurrentUser,
  getUserByIdForAdmin,
  listUsers,
  removeCurrentUserProfileImage,
  replaceCurrentUserProfileImage,
  updateCurrentUser,
  updateUserStatusForAdmin,
} from '../services/user.service';

import {
  createSuccessResponse,
} from '../utils/apiResponse';

import {
  asyncHandler,
} from '../utils/asyncHandler';

import type {
  ChangePasswordInput,
  ListUsersQuery,
  UpdateProfileInput,
  UpdateUserStatusInput,
  UserIdParams,
} from '../validators/user.validator';

const getValidatedBody = <T>(
  request: Request,
): T => {
  return request.validated?.body as T;
};

const getValidatedQuery = <T>(
  request: Request,
): T => {
  return request.validated?.query as T;
};

const getValidatedParams = <T>(
  request: Request,
): T => {
  return request.validated?.params as T;
};

const requireAuthenticatedUserId = (
  request: Request,
): string => {
  if (!request.auth) {
    throw new AppError(
      'Authentication is required',
      401,
      'AUTHENTICATION_REQUIRED',
    );
  }

  return request.auth.userId;
};

/**
 * GET /api/v1/users/me
 */
export const getMyProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        const user =
          await getCurrentUser(
            userId,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'User profile retrieved successfully',
              {
                user,
              },
            ),
          );
      },
    );

/**
 * GET /api/v1/users/me/full-profile
 */
export const getMyFullProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        const result =
          await getCurrentFullProfile(
            userId,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Complete user profile retrieved successfully',
              result,
            ),
          );
      },
    );

/**
 * PATCH /api/v1/users/me
 */
export const updateMyProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        const input =
          getValidatedBody<UpdateProfileInput>(
            request,
          );

        const user =
          await updateCurrentUser(
            userId,
            input,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'User profile updated successfully',
              {
                user,
              },
            ),
          );
      },
    );

/**
 * PATCH /api/v1/users/me/change-password
 */
export const changeMyPassword:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        const input =
          getValidatedBody<ChangePasswordInput>(
            request,
          );

        await changeCurrentUserPassword(
          userId,
          input,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Password changed successfully. Please sign in again.',
              null,
            ),
          );
      },
    );

/**
 * POST /api/v1/users/me/profile-image
 */
export const uploadMyProfileImage:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        if (!request.file) {
          throw new AppError(
            'A profile image file is required',
            400,
            'PROFILE_IMAGE_REQUIRED',
          );
        }

        const user =
          await replaceCurrentUserProfileImage(
            userId,
            request.file.buffer,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Profile image updated successfully',
              {
                user,
              },
            ),
          );
      },
    );

/**
 * DELETE /api/v1/users/me/profile-image
 */
export const deleteMyProfileImage:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        const user =
          await removeCurrentUserProfileImage(
            userId,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Profile image removed successfully',
              {
                user,
              },
            ),
          );
      },
    );

/**
 * PATCH /api/v1/users/me/deactivate
 *
 * This performs soft deactivation.
 */
export const deactivateMyAccount:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedUserId(
            request,
          );

        await deactivateCurrentUser(
          userId,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'User account deactivated successfully',
              null,
            ),
          );
      },
    );

/**
 * GET /api/v1/users
 *
 * Admin only.
 */
export const getUsers:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        requireAuthenticatedUserId(
          request,
        );

        const query =
          getValidatedQuery<ListUsersQuery>(
            request,
          );

        const result =
          await listUsers(
            query,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Users retrieved successfully',
              result,
            ),
          );
      },
    );

/**
 * GET /api/v1/users/:userId
 *
 * Admin only.
 */
export const getUserById:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        requireAuthenticatedUserId(
          request,
        );

        const params =
          getValidatedParams<UserIdParams>(
            request,
          );

        const user =
          await getUserByIdForAdmin(
            params.userId,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'User retrieved successfully',
              {
                user,
              },
            ),
          );
      },
    );

/**
 * PATCH /api/v1/users/:userId/status
 *
 * Admin only.
 */
export const updateUserStatus:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const actingAdminId =
          requireAuthenticatedUserId(
            request,
          );

        const params =
          getValidatedParams<UserIdParams>(
            request,
          );

        const input =
          getValidatedBody<UpdateUserStatusInput>(
            request,
          );

        const user =
          await updateUserStatusForAdmin(
            actingAdminId,
            params.userId,
            input,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'User status updated successfully',
              {
                user,
              },
            ),
          );
      },
    );
