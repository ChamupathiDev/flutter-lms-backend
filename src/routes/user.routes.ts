import { Router } from 'express';

import {
  USER_ROLES,
} from '../constants/user.constants';

import {
  changeMyPassword,
  deactivateMyAccount,
  deleteMyProfileImage,
  getMyFullProfile,
  getMyProfile,
  getUserById,
  getUsers,
  updateMyProfile,
  updateUserStatus,
  uploadMyProfileImage,
} from '../controllers/user.controller';

import {
  authenticate,
} from '../middlewares/authenticate.middleware';

import {
  authorize,
} from '../middlewares/authorize.middleware';

import {
  uploadProfileImage,
} from '../middlewares/upload.middleware';

import {
  validateRequest,
} from '../middlewares/validate.middleware';

import {
  changePasswordBodySchema,
  listUsersQuerySchema,
  updateProfileBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
} from '../validators/user.validator';

const userRouter =
  Router();

/*
 * Every user route requires authentication.
 */
userRouter.use(
  authenticate,
);

/*
 * Current authenticated-user endpoints.
 */

/**
 * Get the current user's shared account information together
 * with the matching student or instructor profile.
 *
 * GET /api/v1/users/me/full-profile
 */
userRouter.get(
  '/me/full-profile',
  getMyFullProfile,
);

/**
 * Get the current user's shared account information.
 *
 * GET /api/v1/users/me
 */
userRouter.get(
  '/me',
  getMyProfile,
);

/**
 * Update the current user's shared account information.
 *
 * Allowed fields:
 * - firstName
 * - lastName
 * - bio
 *
 * PATCH /api/v1/users/me
 */
userRouter.patch(
  '/me',

  validateRequest({
    body:
      updateProfileBodySchema,
  }),

  updateMyProfile,
);

/**
 * Change the current user's password.
 *
 * PATCH /api/v1/users/me/change-password
 */
userRouter.patch(
  '/me/change-password',

  validateRequest({
    body:
      changePasswordBodySchema,
  }),

  changeMyPassword,
);

/**
 * Upload or replace the current user's profile image.
 *
 * Body:
 * multipart/form-data
 *
 * File field:
 * profileImage
 *
 * POST /api/v1/users/me/profile-image
 */
userRouter.post(
  '/me/profile-image',

  uploadProfileImage.single(
    'profileImage',
  ),

  uploadMyProfileImage,
);

/**
 * Remove the current user's profile image.
 *
 * DELETE /api/v1/users/me/profile-image
 */
userRouter.delete(
  '/me/profile-image',
  deleteMyProfileImage,
);

/**
 * Soft-deactivate the current user's account.
 *
 * This does not permanently delete the User,
 * StudentProfile, or InstructorProfile records.
 *
 * PATCH /api/v1/users/me/deactivate
 */
userRouter.patch(
  '/me/deactivate',
  deactivateMyAccount,
);

/*
 * Administrator-only user-management endpoints.
 */

/**
 * List and filter users.
 *
 * Supported query parameters:
 * - page
 * - limit
 * - search
 * - role
 * - status
 *
 * GET /api/v1/users
 */
userRouter.get(
  '/',

  authorize(
    USER_ROLES.ADMIN,
  ),

  validateRequest({
    query:
      listUsersQuerySchema,
  }),

  getUsers,
);

/**
 * Get one user by MongoDB user ID.
 *
 * GET /api/v1/users/:userId
 */
userRouter.get(
  '/:userId',

  authorize(
    USER_ROLES.ADMIN,
  ),

  validateRequest({
    params:
      userIdParamsSchema,
  }),

  getUserById,
);

/**
 * Update another user's account status.
 *
 * PATCH /api/v1/users/:userId/status
 */
userRouter.patch(
  '/:userId/status',

  authorize(
    USER_ROLES.ADMIN,
  ),

  validateRequest({
    params:
      userIdParamsSchema,

    body:
      updateUserStatusBodySchema,
  }),

  updateUserStatus,
);

export default userRouter;