import { z } from 'zod';

import {
  LESSON_TYPES,
} from '../constants/lms.constants';

import {
  mongoIdSchema,
} from './common.validator';

const lessonBase = {
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

  lessonType:
    z.enum(
      LESSON_TYPES,
    ),

  textContent:
    z
      .string()
      .trim()
      .max(50000)
      .nullable()
      .optional(),

  durationMinutes:
    z
      .number()
      .int()
      .min(0)
      .max(1440)
      .default(0),

  isPreview:
    z
      .boolean()
      .default(false),

  isPublished:
    z
      .boolean()
      .default(false),
};

export const createLessonBodySchema =
  z
    .object(
      lessonBase,
    )
    .strict()
    .superRefine(
      (
        data,
        context,
      ) => {
        if (
          data.lessonType ===
            LESSON_TYPES.TEXT &&
          !data.textContent
        ) {
          context.addIssue({
            code:
              'custom',

            path:
              ['textContent'],

            message:
              'Text content is required for a TEXT lesson',
          });
        }
      },
    );

export const updateLessonBodySchema =
  z
    .object({
      title:
        lessonBase
          .title
          .optional(),

      description:
        lessonBase
          .description,

      lessonType:
        lessonBase
          .lessonType
          .optional(),

      textContent:
        lessonBase
          .textContent,

      durationMinutes:
        lessonBase
          .durationMinutes
          .optional(),

      isPreview:
        lessonBase
          .isPreview
          .optional(),

      isPublished:
        lessonBase
          .isPublished
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
          'At least one lesson field must be provided',
      },
    );

export const reorderLessonBodySchema =
  z
    .object({
      order:
        z
          .number()
          .int()
          .positive(),
    })
    .strict();

export const lessonIdParamsSchema =
  z
    .object({
      lessonId:
        mongoIdSchema,
    })
    .strict();

export const sectionLessonParamsSchema =
  z
    .object({
      sectionId:
        mongoIdSchema,
    })
    .strict();

export type CreateLessonInput =
  z.infer<
    typeof createLessonBodySchema
  >;

export type UpdateLessonInput =
  z.infer<
    typeof updateLessonBodySchema
  >;

export type ReorderLessonInput =
  z.infer<
    typeof reorderLessonBodySchema
  >;

export type LessonIdParams =
  z.infer<
    typeof lessonIdParamsSchema
  >;

export type SectionLessonParams =
  z.infer<
    typeof sectionLessonParamsSchema
  >;