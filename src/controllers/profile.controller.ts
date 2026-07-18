import type {
  Request,
  RequestHandler,
} from 'express';

import {
  USER_ROLES,
  type UserRole,
} from '../constants/user.constants';

import {
  AppError,
} from '../errors/AppError';

import {
  createInstructorProfile,
  createStudentProfile,
  deleteInstructorProfile,
  deleteStudentProfile,
  getInstructorProfile,
  getStudentProfile,
  updateInstructorProfile,
  updateStudentProfile,
} from '../services/profile.service';

import {
  createSuccessResponse,
} from '../utils/apiResponse';

import {
  asyncHandler,
} from '../utils/asyncHandler';

import type {
  CreateInstructorProfileInput,
  CreateStudentProfileInput,
  UpdateInstructorProfileInput,
  UpdateStudentProfileInput,
} from '../validators/profile.validator';

const getValidatedBody = <T>(
  request: Request,
): T => {
  return request.validated
    ?.body as T;
};

const requireAuthenticatedRole = (
  request: Request,
  requiredRole: UserRole,
): string => {
  if (!request.auth) {
    throw new AppError(
      'Authentication is required',
      401,
      'AUTHENTICATION_REQUIRED',
    );
  }

  if (
    request.auth.role !==
    requiredRole
  ) {
    throw new AppError(
      `Only ${requiredRole.toLowerCase()} users can access this profile`,
      403,
      'PROFILE_ROLE_NOT_ALLOWED',
    );
  }

  return request.auth.userId;
};

export const createMyStudentProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.STUDENT,
          );

        const input =
          getValidatedBody<CreateStudentProfileInput>(
            request,
          );

        const profile =
          await createStudentProfile(
            userId,
            input,
          );

        response
          .status(201)
          .json(
            createSuccessResponse(
              'Student profile created successfully',
              {
                profile,
              },
            ),
          );
      },
    );

export const getMyStudentProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.STUDENT,
          );

        const profile =
          await getStudentProfile(
            userId,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Student profile retrieved successfully',
              {
                profile,
              },
            ),
          );
      },
    );

export const updateMyStudentProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.STUDENT,
          );

        const input =
          getValidatedBody<UpdateStudentProfileInput>(
            request,
          );

        const profile =
          await updateStudentProfile(
            userId,
            input,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Student profile updated successfully',
              {
                profile,
              },
            ),
          );
      },
    );

export const deleteMyStudentProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.STUDENT,
          );

        await deleteStudentProfile(
          userId,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Student profile deleted successfully',
              null,
            ),
          );
      },
    );

export const createMyInstructorProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.INSTRUCTOR,
          );

        const input =
          getValidatedBody<CreateInstructorProfileInput>(
            request,
          );

        const profile =
          await createInstructorProfile(
            userId,
            input,
          );

        response
          .status(201)
          .json(
            createSuccessResponse(
              'Instructor profile created successfully',
              {
                profile,
              },
            ),
          );
      },
    );

export const getMyInstructorProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.INSTRUCTOR,
          );

        const profile =
          await getInstructorProfile(
            userId,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Instructor profile retrieved successfully',
              {
                profile,
              },
            ),
          );
      },
    );

export const updateMyInstructorProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.INSTRUCTOR,
          );

        const input =
          getValidatedBody<UpdateInstructorProfileInput>(
            request,
          );

        const profile =
          await updateInstructorProfile(
            userId,
            input,
          );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Instructor profile updated successfully',
              {
                profile,
              },
            ),
          );
      },
    );

export const deleteMyInstructorProfile:
  RequestHandler =
    asyncHandler(
      async (
        request,
        response,
      ) => {
        const userId =
          requireAuthenticatedRole(
            request,
            USER_ROLES.INSTRUCTOR,
          );

        await deleteInstructorProfile(
          userId,
        );

        response
          .status(200)
          .json(
            createSuccessResponse(
              'Instructor profile deleted successfully',
              null,
            ),
          );
      },
    );