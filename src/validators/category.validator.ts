import { z } from 'zod';

import {
  booleanQuerySchema,
  mongoIdSchema,
  paginationQuerySchema,
} from './common.validator';

const categoryFields = {
  name:
    z
      .string()
      .trim()
      .min(2)
      .max(80),

  description:
    z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
};

export const createCategoryBodySchema =
  z
    .object(
      categoryFields,
    )
    .strict();

export const updateCategoryBodySchema =
  z
    .object({
      name:
        categoryFields
          .name
          .optional(),

      description:
        categoryFields
          .description,
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
          'At least one category field must be provided',
      },
    );

export const updateCategoryStatusBodySchema =
  z
    .object({
      isActive:
        z.boolean(),
    })
    .strict();

export const categoryIdParamsSchema =
  z
    .object({
      categoryId:
        mongoIdSchema,
    })
    .strict();

export const listCategoriesQuerySchema =
  paginationQuerySchema
    .extend({
      search:
        z
          .string()
          .trim()
          .max(100)
          .optional(),

      activeOnly:
        booleanQuerySchema
          .default(true),
    })
    .strict();

export type CreateCategoryInput =
  z.infer<
    typeof createCategoryBodySchema
  >;

export type UpdateCategoryInput =
  z.infer<
    typeof updateCategoryBodySchema
  >;

export type UpdateCategoryStatusInput =
  z.infer<
    typeof updateCategoryStatusBodySchema
  >;

export type CategoryIdParams =
  z.infer<
    typeof categoryIdParamsSchema
  >;

export type ListCategoriesQuery =
  z.infer<
    typeof listCategoriesQuerySchema
  >;