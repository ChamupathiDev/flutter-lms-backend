import { z } from 'zod';

export const mongoIdSchema =
  z
    .string()
    .regex(
      /^[a-f\d]{24}$/i,
      'A valid MongoDB ID is required',
    );

export const booleanQuerySchema =
  z.preprocess(
    (value) => {
      if (
        typeof value ===
        'boolean'
      ) {
        return value;
      }

      if (
        typeof value ===
        'string'
      ) {
        const normalized =
          value
            .trim()
            .toLowerCase();

        if (
          normalized ===
          'true'
        ) {
          return true;
        }

        if (
          normalized ===
          'false'
        ) {
          return false;
        }
      }

      return value;
    },

    z.boolean(),
  );

export const paginationQuerySchema =
  z
    .object({
      page:
        z.coerce
          .number()
          .int()
          .positive()
          .default(1),

      limit:
        z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(20),
    })
    .strict();

export const nonEmptyStringArraySchema = (
  maxItems = 20,
  maxLength = 200,
) =>
  z
    .array(
      z
        .string()
        .trim()
        .min(2)
        .max(
          maxLength,
        ),
    )
    .max(
      maxItems,
    )
    .default([]);