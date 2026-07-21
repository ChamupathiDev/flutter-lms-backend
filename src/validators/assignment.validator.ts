import { z } from 'zod';

import {
  SUBMISSION_STATUSES,
} from '../constants/lms.constants';

import {
  mongoIdSchema,
  paginationQuerySchema,
} from './common.validator';

export const createAssignmentBodySchema =
  z
    .object({
      sectionId:
        mongoIdSchema
          .optional(),

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
          .min(5)
          .max(2000),

      instructions:
        z
          .string()
          .trim()
          .min(5)
          .max(5000),

      dueDate:
        z.coerce
          .date()
          .optional(),

      maximumMarks:
        z
          .number()
          .min(1)
          .max(1000),
    })
    .strict();

export const updateAssignmentBodySchema =
  z
    .object({
      sectionId:
        mongoIdSchema
          .nullable()
          .optional(),

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
          .min(5)
          .max(2000)
          .optional(),

      instructions:
        z
          .string()
          .trim()
          .min(5)
          .max(5000)
          .optional(),

      dueDate:
        z.coerce
          .date()
          .nullable()
          .optional(),

      maximumMarks:
        z
          .number()
          .min(1)
          .max(1000)
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
          'At least one assignment field must be provided',
      },
    );

export const submitAssignmentBodySchema =
  z
    .object({
      textAnswer:
        z
          .string()
          .trim()
          .max(10000)
          .nullable()
          .optional(),
    })
    .strict();

export const updateSubmissionBodySchema =
  z
    .object({
      textAnswer:
        z
          .string()
          .trim()
          .max(10000)
          .nullable(),
    })
    .strict();

export const gradeSubmissionBodySchema =
  z
    .object({
      marksAwarded:
        z
          .number()
          .min(0),

      feedback:
        z
          .string()
          .trim()
          .max(3000)
          .nullable()
          .optional(),

      status:
        z
          .enum({
            GRADED:
              SUBMISSION_STATUSES
                .GRADED,

            RESUBMISSION_REQUIRED:
              SUBMISSION_STATUSES
                .RESUBMISSION_REQUIRED,
          })
          .default(
            SUBMISSION_STATUSES
              .GRADED,
          ),
    })
    .strict();

export const assignmentIdParamsSchema =
  z
    .object({
      assignmentId:
        mongoIdSchema,
    })
    .strict();

export const submissionIdParamsSchema =
  z
    .object({
      submissionId:
        mongoIdSchema,
    })
    .strict();

export const courseAssignmentParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export const listSubmissionsQuerySchema =
  paginationQuerySchema
    .extend({
      status:
        z
          .enum(
            SUBMISSION_STATUSES,
          )
          .optional(),
    })
    .strict();

export type CreateAssignmentInput =
  z.infer<
    typeof createAssignmentBodySchema
  >;

export type UpdateAssignmentInput =
  z.infer<
    typeof updateAssignmentBodySchema
  >;

export type SubmitAssignmentInput =
  z.infer<
    typeof submitAssignmentBodySchema
  >;

export type UpdateSubmissionInput =
  z.infer<
    typeof updateSubmissionBodySchema
  >;

export type GradeSubmissionInput =
  z.infer<
    typeof gradeSubmissionBodySchema
  >;

export type AssignmentIdParams =
  z.infer<
    typeof assignmentIdParamsSchema
  >;

export type SubmissionIdParams =
  z.infer<
    typeof submissionIdParamsSchema
  >;

export type CourseAssignmentParams =
  z.infer<
    typeof courseAssignmentParamsSchema
  >;

export type ListSubmissionsQuery =
  z.infer<
    typeof listSubmissionsQuerySchema
  >;