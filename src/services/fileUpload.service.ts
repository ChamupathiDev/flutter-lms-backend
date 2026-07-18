import type {
  UploadApiResponse,
} from 'cloudinary';

import { cloudinary } from '../config/cloudinary';
import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';

export interface UploadedImage {
  url: string;
  publicId: string;
}

export const uploadProfileImageBuffer =
  async (
    buffer: Buffer,
    userId: string,
  ): Promise<UploadedImage> => {
    if (
      !environment
        .CLOUDINARY_ENABLED
    ) {
      throw new AppError(
        'Profile-image storage is not configured',
        503,
        'IMAGE_STORAGE_UNAVAILABLE',
      );
    }

    return new Promise<UploadedImage>(
      (
        resolve,
        reject,
      ) => {
        const uploadStream =
          cloudinary
            .uploader
            .upload_stream(
              {
                folder:
                  environment
                    .CLOUDINARY_FOLDER,

                public_id:
                  `${userId}-${Date.now()}`,

                resource_type:
                  'image',

                overwrite:
                  false,

                transformation: [
                  {
                    width:
                      600,

                    height:
                      600,

                    crop:
                      'fill',

                    gravity:
                      'face',

                    quality:
                      'auto',

                    fetch_format:
                      'auto',
                  },
                ],
              },

              (
                error,
                result?:
                  UploadApiResponse,
              ) => {
                if (
                  error ||
                  !result
                ) {
                  reject(
                    new AppError(
                      'The profile image could not be uploaded',
                      503,
                      'IMAGE_UPLOAD_FAILED',
                    ),
                  );

                  return;
                }

                resolve({
                  url:
                    result
                      .secure_url,

                  publicId:
                    result
                      .public_id,
                });
              },
            );

        uploadStream.end(
          buffer,
        );
      },
    );
  };

export const deleteStoredImage =
  async (
    publicId?: string,
  ): Promise<void> => {
    if (
      !publicId ||
      !environment
        .CLOUDINARY_ENABLED
    ) {
      return;
    }

    try {
      await cloudinary
        .uploader
        .destroy(
          publicId,
          {
            resource_type:
              'image',

            invalidate:
              true,
          },
        );
    } catch {
      // A cleanup failure should not
      // make the user operation fail.
    }
  };