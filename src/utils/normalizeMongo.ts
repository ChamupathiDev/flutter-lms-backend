import { Types } from 'mongoose';

const privateKeys = new Set([
  '__v',
  'passwordHash',
  'tokenVersion',
  'profileImagePublicId',
  'thumbnailPublicId',
  'videoPublicId',
  'documentPublicId',
  'attachmentPublicId',
  'filePublicId',
]);

export const normalizeMongo = (
  value: unknown,
): unknown => {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeMongo);
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    const source =
      'toObject' in value &&
      typeof (
        value as {
          toObject?: unknown;
        }
      ).toObject === 'function'
        ? (
            value as {
              toObject: () => Record<string, unknown>;
            }
          ).toObject()
        : value as Record<string, unknown>;

    const output: Record<string, unknown> = {};

    for (
      const [key, item]
      of Object.entries(source)
    ) {
      if (privateKeys.has(key)) {
        continue;
      }

      if (key === '_id') {
        output.id =
          normalizeMongo(item);
      } else {
        output[key] =
          normalizeMongo(item);
      }
    }

    return output;
  }

  return value;
};