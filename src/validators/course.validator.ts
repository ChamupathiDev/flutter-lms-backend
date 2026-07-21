import { z } from 'zod';

import {
  COURSE_LEVELS,
  COURSE_STATUSES,
} from '../constants/lms.constants';

import {
  mongoIdSchema,
  nonEmptyStringArraySchema,
  paginationQuerySchema,
} from './common.validator';

const courseFields = {
  categoryId:
    mongoIdSchema,

  title:
    z
      .string()
      .trim()
      .min(3)
      .max(150),

  shortDescription:
    z
      .string()
      .trim()
      .min(10)
      .max(250),

  description:
    z
      .string()
      .trim()
      .min(20)
      .max(5000),

  level:
    z.enum(
      COURSE_LEVELS,
    ),

  language:
    z
      .string()
      .trim()
      .min(2)
      .max(50),

  requirements:
    nonEmptyStringArraySchema(),

  learningOutcomes:
    nonEmptyStringArraySchema(),

  targetAudience:
    nonEmptyStringArraySchema(),
};

export const createCourseBodySchema =
  z
    .object(
      courseFields,
    )
    .strict();

export const updateCourseBodySchema =
  z
    .object({
      categoryId:
        courseFields
          .categoryId
          .optional(),

      title:
        courseFields
          .title
          .optional(),

      shortDescription:
        courseFields
          .shortDescription
          .optional(),

      description:
        courseFields
          .description
          .optional(),

      level:
        courseFields
          .level
          .optional(),

      language:
        courseFields
          .language
          .optional(),

      requirements:
        courseFields
          .requirements
          .optional(),

      learningOutcomes:
        courseFields
          .learningOutcomes
          .optional(),

      targetAudience:
        courseFields
          .targetAudience
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
          'At least one course field must be provided',
      },
    );

export const courseIdParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export const listCoursesQuerySchema =
  paginationQuerySchema
    .extend({
      search:
        z
          .string()
          .trim()
          .max(100)
          .optional(),

      categoryId:
        mongoIdSchema
          .optional(),

      level:
        z
          .enum(
            COURSE_LEVELS,
          )
          .optional(),

      language:
        z
          .string()
          .trim()
          .max(50)
          .optional(),
    })
    .strict();

export const listInstructorCoursesQuerySchema =
  paginationQuerySchema
    .extend({
      search:
        z
          .string()
          .trim()
          .max(100)
          .optional(),

      status:
        z
          .enum(
            COURSE_STATUSES,
          )
          .optional(),
    })
    .strict();

export const listAdminCoursesQuerySchema =
  paginationQuerySchema
    .extend({
      search:
        z
          .string()
          .trim()
          .max(100)
          .optional(),

      status:
        z
          .enum(
            COURSE_STATUSES,
          )
          .optional(),

      instructorId:
        mongoIdSchema
          .optional(),

      categoryId:
        mongoIdSchema
          .optional(),
    })
    .strict();

export type CreateCourseInput =
  z.infer<
    typeof createCourseBodySchema
  >;

export type UpdateCourseInput =
  z.infer<
    typeof updateCourseBodySchema
  >;

export type CourseIdParams =
  z.infer<
    typeof courseIdParamsSchema
  >;

export type ListCoursesQuery =
  z.infer<
    typeof listCoursesQuerySchema
  >;

export type ListInstructorCoursesQuery =
  z.infer<
    typeof listInstructorCoursesQuerySchema
  >;

export type ListAdminCoursesQuery =
  z.infer<
    typeof listAdminCoursesQuerySchema
  >;