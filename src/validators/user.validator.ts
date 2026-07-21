import { z } from 'zod';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../constants/user.constants';

import {
  passwordSchema,
} from './auth.validator';

const nameSchema =
  z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(
      /^[\p{L}\p{M}' -]+$/u,
    );

export const updateProfileBodySchema =
  z
    .object({
      firstName:
        nameSchema
          .optional(),

      lastName:
        nameSchema
          .optional(),

      bio:
        z
          .string()
          .trim()
          .max(500)
          .nullable()
          .optional(),
    })
    .strict()
    .refine(
      (data) =>
        Object
          .values(data)
          .some(
            (value) =>
              value !== undefined,
          ),
      {
        message:
          'At least one profile field must be provided',
      },
    );

export const changePasswordBodySchema =
  z
    .object({
      currentPassword:
        z
          .string()
          .min(
            1,
            'Current password is required',
          ),

      newPassword:
        passwordSchema,

      confirmPassword:
        z.string(),
    })
    .strict()
    .refine(
      (data) =>
        data.newPassword ===
        data.confirmPassword,
      {
        path:
          ['confirmPassword'],

        message:
          'Passwords do not match',
      },
    )
    .refine(
      (data) =>
        data.currentPassword !==
        data.newPassword,
      {
        path:
          ['newPassword'],

        message:
          'New password must be different from the current password',
      },
    );

const mongoIdSchema =
  z
    .string()
    .regex(
      /^[a-f\d]{24}$/i,
      'A valid user ID is required',
    );

export const userIdParamsSchema =
  z
    .object({
      userId:
        mongoIdSchema,
    })
    .strict();

export const listUsersQuerySchema =
  z
    .object({
      page:
        z.coerce
          .number()
          .int()
          .positive()
          .default(1),

      limit:
        z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(20),

      search:
        z
          .string()
          .trim()
          .max(100)
          .optional(),

      role:
        z
          .enum(
            USER_ROLES,
          )
          .optional(),

      status:
        z
          .enum(
            USER_STATUSES,
          )
          .optional(),
    })
    .strict();

export const updateUserStatusBodySchema =
  z
    .object({
      status:
        z.enum(
          USER_STATUSES,
        ),
    })
    .strict();

export type UpdateProfileInput =
  z.infer<
    typeof updateProfileBodySchema
  >;

export type ChangePasswordInput =
  z.infer<
    typeof changePasswordBodySchema
  >;

export type UserIdParams =
  z.infer<
    typeof userIdParamsSchema
  >;

export type ListUsersQuery =
  z.infer<
    typeof listUsersQuerySchema
  >;

export type UpdateUserStatusInput =
  z.infer<
    typeof updateUserStatusBodySchema
  >;