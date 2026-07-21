import { z } from 'zod';

import {
  mongoIdSchema,
  paginationQuerySchema,
} from './common.validator';

export const createReviewBodySchema =
  z
    .object({
      rating:
        z
          .number()
          .int()
          .min(1)
          .max(5),

      comment:
        z
          .string()
          .trim()
          .max(1500)
          .nullable()
          .optional(),
    })
    .strict();

export const updateReviewBodySchema =
  z
    .object({
      rating:
        z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional(),

      comment:
        z
          .string()
          .trim()
          .max(1500)
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
          'At least one review field must be provided',
      },
    );

export const updateReviewVisibilityBodySchema =
  z
    .object({
      isVisible:
        z.boolean(),
    })
    .strict();

export const reviewIdParamsSchema =
  z
    .object({
      reviewId:
        mongoIdSchema,
    })
    .strict();

export const courseReviewParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export const listReviewsQuerySchema =
  paginationQuerySchema;

export type CreateReviewInput =
  z.infer<
    typeof createReviewBodySchema
  >;

export type UpdateReviewInput =
  z.infer<
    typeof updateReviewBodySchema
  >;

export type UpdateReviewVisibilityInput =
  z.infer<
    typeof updateReviewVisibilityBodySchema
  >;

export type ReviewIdParams =
  z.infer<
    typeof reviewIdParamsSchema
  >;

export type CourseReviewParams =
  z.infer<
    typeof courseReviewParamsSchema
  >;

export type ListReviewsQuery =
  z.infer<
    typeof listReviewsQuerySchema
  >;