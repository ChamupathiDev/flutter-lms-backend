import { z } from 'zod';

import {
  mongoIdSchema,
} from './common.validator';

export const createSectionBodySchema =
  z
    .object({
      title:
        z
          .string()
          .trim()
          .min(2)
          .max(150),

      description:
        z
          .string()
          .trim()
          .max(1000)
          .nullable()
          .optional(),

      isPublished:
        z
          .boolean()
          .default(false),
    })
    .strict();

export const updateSectionBodySchema =
  z
    .object({
      title:
        z
          .string()
          .trim()
          .min(2)
          .max(150)
          .optional(),

      description:
        z
          .string()
          .trim()
          .max(1000)
          .nullable()
          .optional(),

      isPublished:
        z
          .boolean()
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
          'At least one section field must be provided',
      },
    );

export const reorderSectionBodySchema =
  z
    .object({
      order:
        z
          .number()
          .int()
          .positive(),
    })
    .strict();

export const sectionIdParamsSchema =
  z
    .object({
      sectionId:
        mongoIdSchema,
    })
    .strict();

export const courseSectionParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export type CreateSectionInput =
  z.infer<
    typeof createSectionBodySchema
  >;

export type UpdateSectionInput =
  z.infer<
    typeof updateSectionBodySchema
  >;

export type ReorderSectionInput =
  z.infer<
    typeof reorderSectionBodySchema
  >;

export type SectionIdParams =
  z.infer<
    typeof sectionIdParamsSchema
  >;

export type CourseSectionParams =
  z.infer<
    typeof courseSectionParamsSchema
  >;