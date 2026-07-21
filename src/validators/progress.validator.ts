import { z } from 'zod';

import {
  mongoIdSchema,
} from './common.validator';

export const lessonProgressParamsSchema =
  z
    .object({
      lessonId:
        mongoIdSchema,
    })
    .strict();

export const courseProgressParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export const enrollmentProgressParamsSchema =
  z
    .object({
      enrollmentId:
        mongoIdSchema,
    })
    .strict();

export type LessonProgressParams =
  z.infer<
    typeof lessonProgressParamsSchema
  >;

export type CourseProgressParams =
  z.infer<
    typeof courseProgressParamsSchema
  >;

export type EnrollmentProgressParams =
  z.infer<
    typeof enrollmentProgressParamsSchema
  >;