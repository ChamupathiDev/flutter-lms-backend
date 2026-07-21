import { z } from 'zod';

import {
  ENROLLMENT_STATUSES,
} from '../constants/lms.constants';

import {
  mongoIdSchema,
  paginationQuerySchema,
} from './common.validator';

export const enrollmentIdParamsSchema =
  z
    .object({
      enrollmentId:
        mongoIdSchema,
    })
    .strict();

export const courseEnrollmentParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export const listEnrollmentsQuerySchema =
  paginationQuerySchema
    .extend({
      status:
        z
          .enum(
            ENROLLMENT_STATUSES,
          )
          .optional(),
    })
    .strict();

export const listAdminEnrollmentsQuerySchema =
  paginationQuerySchema
    .extend({
      status:
        z
          .enum(
            ENROLLMENT_STATUSES,
          )
          .optional(),

      courseId:
        mongoIdSchema
          .optional(),

      studentId:
        mongoIdSchema
          .optional(),
    })
    .strict();

export type EnrollmentIdParams =
  z.infer<
    typeof enrollmentIdParamsSchema
  >;

export type CourseEnrollmentParams =
  z.infer<
    typeof courseEnrollmentParamsSchema
  >;

export type ListEnrollmentsQuery =
  z.infer<
    typeof listEnrollmentsQuerySchema
  >;

export type ListAdminEnrollmentsQuery =
  z.infer<
    typeof listAdminEnrollmentsQuerySchema
  >;