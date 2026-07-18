import { z } from 'zod';

const trimmedLimitedText = (
  minimum: number,
  maximum: number,
  fieldName: string,
) =>
  z
    .string()
    .trim()
    .min(
      minimum,
      `${fieldName} must contain at least ${minimum} characters`,
    )
    .max(
      maximum,
      `${fieldName} must contain at most ${maximum} characters`,
    );

export const studentProfileFieldShape = {
  dateOfBirth:
    z.coerce
      .date({
        error:
          'A valid date of birth is required',
      })
      .refine(
        (value) =>
          value.getTime() <=
          Date.now(),
        {
          message:
            'Date of birth cannot be in the future',
        },
      ),

  educationLevel:
    trimmedLimitedText(
      2,
      100,
      'Education level',
    ),

  learningGoals:
    z
      .array(
        trimmedLimitedText(
          2,
          150,
          'Learning goal',
        ),
      )
      .max(
        10,
        'A maximum of 10 learning goals is allowed',
      )
      .default([]),
};

export const instructorProfileFieldShape = {
  headline:
    trimmedLimitedText(
      2,
      120,
      'Headline',
    ),

  qualification:
    trimmedLimitedText(
      2,
      200,
      'Qualification',
    ),

  experienceYears:
    z.coerce
      .number()
      .int(
        'Experience years must be a whole number',
      )
      .min(
        0,
        'Experience years cannot be negative',
      )
      .max(
        80,
        'Experience years cannot be greater than 80',
      ),

  expertise:
    z
      .array(
        trimmedLimitedText(
          2,
          80,
          'Expertise item',
        ),
      )
      .min(
        1,
        'At least one expertise item is required',
      )
      .max(
        20,
        'A maximum of 20 expertise items is allowed',
      ),

  biography:
    z
      .string()
      .trim()
      .max(
        1000,
        'Biography must contain at most 1000 characters',
      )
      .nullable()
      .optional(),
};

export const createStudentProfileBodySchema =
  z
    .object(
      studentProfileFieldShape,
    )
    .strict();

export const updateStudentProfileBodySchema =
  z
    .object(
      studentProfileFieldShape,
    )
    .partial()
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length >
        0,
      {
        message:
          'At least one student profile field is required',
      },
    );

export const createInstructorProfileBodySchema =
  z
    .object(
      instructorProfileFieldShape,
    )
    .strict();

export const updateInstructorProfileBodySchema =
  z
    .object(
      instructorProfileFieldShape,
    )
    .partial()
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length >
        0,
      {
        message:
          'At least one instructor profile field is required',
      },
    );

export type CreateStudentProfileInput =
  z.infer<
    typeof createStudentProfileBodySchema
  >;

export type UpdateStudentProfileInput =
  z.infer<
    typeof updateStudentProfileBodySchema
  >;

export type CreateInstructorProfileInput =
  z.infer<
    typeof createInstructorProfileBodySchema
  >;

export type UpdateInstructorProfileInput =
  z.infer<
    typeof updateInstructorProfileBodySchema
  >;