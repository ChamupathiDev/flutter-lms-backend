import multer from 'multer';

import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';

const memoryStorage =
  multer.memoryStorage();

const createUpload = (
  acceptedTypes:
    Set<string>,

  maxMb:
    number,

  typeMessage:
    string,
) =>
  multer({
    storage:
      memoryStorage,

    limits: {
      fileSize:
        maxMb *
        1024 *
        1024,

      files:
        1,

      fields:
        10,
    },

    fileFilter: (
      _request,
      file,
      callback,
    ) => {
      if (
        !acceptedTypes.has(
          file.mimetype,
        )
      ) {
        callback(
          new AppError(
            typeMessage,
            415,
            'UNSUPPORTED_FILE_TYPE',
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

export const uploadProfileImage =
  createUpload(
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]),

    environment
      .PROFILE_IMAGE_MAX_MB,

    'Only JPEG, PNG and WebP images are allowed',
  );

export const uploadCourseThumbnail =
  createUpload(
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]),

    5,

    'Only JPEG, PNG and WebP course thumbnails are allowed',
  );

export const uploadLessonVideo =
  createUpload(
    new Set([
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]),

    100,

    'Only MP4, WebM and MOV lesson videos are allowed',
  );

export const uploadDocument =
  createUpload(
    new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ]),

    20,

    'Only PDF, Word, PowerPoint and text documents are allowed',
  );

export const uploadAssignmentSubmission =
  createUpload(
    new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'image/jpeg',
      'image/png',
      'text/plain',
    ]),

    20,

    'Only PDF, Word, ZIP, JPEG, PNG and text submission files are allowed',
  );