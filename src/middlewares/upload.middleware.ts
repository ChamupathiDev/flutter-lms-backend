import multer from 'multer';

import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';

const acceptedImageTypes =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

export const uploadProfileImage =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        environment
          .PROFILE_IMAGE_MAX_MB *
        1024 *
        1024,

      files:
        1,

      fields:
        5,
    },

    fileFilter: (
      _request,
      file,
      callback,
    ) => {
      if (
        !acceptedImageTypes.has(
          file.mimetype,
        )
      ) {
        callback(
          new AppError(
            'Only JPEG, PNG and WebP profile images are allowed',
            415,
            'UNSUPPORTED_IMAGE_TYPE',
          ),
        );

        return;
      }

      callback(
        null,
        true,
      );
    },
  });