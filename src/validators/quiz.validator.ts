import { z } from 'zod';

import {
  QUIZ_QUESTION_TYPES,
} from '../constants/lms.constants';

import {
  mongoIdSchema,
  paginationQuerySchema,
} from './common.validator';

export const createQuizBodySchema =
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
          .max(1000)
          .nullable()
          .optional(),

      passingScore:
        z
          .number()
          .min(0)
          .max(100),

      timeLimitMinutes:
        z
          .number()
          .int()
          .min(0)
          .max(600)
          .default(0),

      maxAttempts:
        z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(1),
    })
    .strict();

export const updateQuizBodySchema =
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
          .max(1000)
          .nullable()
          .optional(),

      passingScore:
        z
          .number()
          .min(0)
          .max(100)
          .optional(),

      timeLimitMinutes:
        z
          .number()
          .int()
          .min(0)
          .max(600)
          .optional(),

      maxAttempts:
        z
          .number()
          .int()
          .min(1)
          .max(20)
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
          'At least one quiz field must be provided',
      },
    );

const optionSchema =
  z
    .object({
      id:
        z
          .string()
          .trim()
          .min(1)
          .max(50),

      text:
        z
          .string()
          .trim()
          .min(1)
          .max(500),
    })
    .strict();

const quizQuestionFields = {
  questionText:
    z
      .string()
      .trim()
      .min(2)
      .max(2000),

  questionType:
    z.enum(
      QUIZ_QUESTION_TYPES,
    ),

  options:
    z
      .array(
        optionSchema,
      )
      .min(2)
      .max(10),

  correctOptionIds:
    z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(50),
      )
      .min(1)
      .max(10),

  marks:
    z
      .number()
      .min(0.5)
      .max(100)
      .default(1),
};

const validateQuizQuestion = (
  data: {
    questionType:
      (
        typeof QUIZ_QUESTION_TYPES
      )[
        keyof typeof QUIZ_QUESTION_TYPES
      ];

    options:
      Array<{
        id:
          string;

        text:
          string;
      }>;

    correctOptionIds:
      string[];
  },

  context:
    z.RefinementCtx,
) => {
  const optionIds =
    new Set(
      data.options.map(
        (option) =>
          option.id,
      ),
    );

  if (
    optionIds.size !==
    data.options.length
  ) {
    context.addIssue({
      code:
        'custom',

      path:
        ['options'],

      message:
        'Option IDs must be unique',
    });
  }

  if (
    data.correctOptionIds
      .some(
        (id) =>
          !optionIds.has(id),
      )
  ) {
    context.addIssue({
      code:
        'custom',

      path:
        ['correctOptionIds'],

      message:
        'Every correct option ID must exist in options',
    });
  }

  if (
    (
      data.questionType ===
        QUIZ_QUESTION_TYPES
          .SINGLE_CHOICE ||
      data.questionType ===
        QUIZ_QUESTION_TYPES
          .TRUE_FALSE
    ) &&
    data.correctOptionIds
      .length !== 1
  ) {
    context.addIssue({
      code:
        'custom',

      path:
        ['correctOptionIds'],

      message:
        'This question type requires exactly one correct option',
    });
  }

  if (
    data.questionType ===
      QUIZ_QUESTION_TYPES
        .TRUE_FALSE &&
    data.options.length !==
      2
  ) {
    context.addIssue({
      code:
        'custom',

      path:
        ['options'],

      message:
        'A TRUE_FALSE question requires exactly two options',
    });
  }
};

export const createQuizQuestionBodySchema =
  z
    .object(
      quizQuestionFields,
    )
    .strict()
    .superRefine(
      validateQuizQuestion,
    );

export const updateQuizQuestionBodySchema =
  z
    .object({
      questionText:
        quizQuestionFields
          .questionText
          .optional(),

      questionType:
        quizQuestionFields
          .questionType
          .optional(),

      options:
        quizQuestionFields
          .options
          .optional(),

      correctOptionIds:
        quizQuestionFields
          .correctOptionIds
          .optional(),

      marks:
        z
          .number()
          .min(0.5)
          .max(100)
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
          'At least one question field must be provided',
      },
    );

export const submitQuizAttemptBodySchema =
  z
    .object({
      answers:
        z
          .array(
            z
              .object({
                questionId:
                  mongoIdSchema,

                selectedOptionIds:
                  z
                    .array(
                      z
                        .string()
                        .trim()
                        .min(1)
                        .max(50),
                    )
                    .max(10),
              })
              .strict(),
          )
          .max(200),
    })
    .strict();

export const quizIdParamsSchema =
  z
    .object({
      quizId:
        mongoIdSchema,
    })
    .strict();

export const quizQuestionIdParamsSchema =
  z
    .object({
      questionId:
        mongoIdSchema,
    })
    .strict();

export const quizAttemptIdParamsSchema =
  z
    .object({
      attemptId:
        mongoIdSchema,
    })
    .strict();

export const courseQuizParamsSchema =
  z
    .object({
      courseId:
        mongoIdSchema,
    })
    .strict();

export const listQuizAttemptsQuerySchema =
  paginationQuerySchema;

export type CreateQuizInput =
  z.infer<
    typeof createQuizBodySchema
  >;

export type UpdateQuizInput =
  z.infer<
    typeof updateQuizBodySchema
  >;

export type CreateQuizQuestionInput =
  z.infer<
    typeof createQuizQuestionBodySchema
  >;

export type UpdateQuizQuestionInput =
  z.infer<
    typeof updateQuizQuestionBodySchema
  >;

export type SubmitQuizAttemptInput =
  z.infer<
    typeof submitQuizAttemptBodySchema
  >;

export type QuizIdParams =
  z.infer<
    typeof quizIdParamsSchema
  >;

export type QuizQuestionIdParams =
  z.infer<
    typeof quizQuestionIdParamsSchema
  >;

export type QuizAttemptIdParams =
  z.infer<
    typeof quizAttemptIdParamsSchema
  >;

export type CourseQuizParams =
  z.infer<
    typeof courseQuizParamsSchema
  >;