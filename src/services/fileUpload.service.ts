import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';
import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';

export type StoredAssetResourceType = 'image' | 'video' | 'raw';

export interface UploadedAsset {
  url: string;
  publicId: string;
  resourceType: StoredAssetResourceType;
  originalFilename?: string;
}

interface UploadBufferOptions {
  buffer: Buffer;
  ownerId: string;
  folder: string;
  resourceType: StoredAssetResourceType;
  originalFilename?: string;
  transformation?: UploadApiOptions['transformation'];
}

export const uploadAssetBuffer = async ({
  buffer,
  ownerId,
  folder,
  resourceType,
  originalFilename,
  transformation,
}: UploadBufferOptions): Promise<UploadedAsset> => {
  if (!environment.CLOUDINARY_ENABLED) {
    throw new AppError(
      'File storage is not configured',
      503,
      'FILE_STORAGE_UNAVAILABLE',
    );
  }

  const storageRoot = environment.CLOUDINARY_FOLDER
    .replace(/(?:^|\/)profile-images\/?$/i, '')
    .replace(/\/+$/g, '');
  const destinationFolder = storageRoot ? `${storageRoot}/${folder}` : folder;

  return new Promise<UploadedAsset>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: destinationFolder,
        public_id: `${ownerId}-${Date.now()}`,
        resource_type: resourceType,
        overwrite: false,
        use_filename: false,
        unique_filename: true,
        transformation,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(
            new AppError(
              'The file could not be uploaded',
              503,
              'FILE_UPLOAD_FAILED',
            ),
          );
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType,
          originalFilename,
        });
      },
    );

    uploadStream.end(buffer);
  });
};

export const deleteStoredAsset = async (
  publicId?: string,
  resourceType: StoredAssetResourceType = 'image',
): Promise<void> => {
  if (!publicId || !environment.CLOUDINARY_ENABLED) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch {
    // Storage cleanup must not make the database operation fail.
  }
};

export const uploadProfileImageBuffer = async (
  buffer: Buffer,
  userId: string,
): Promise<UploadedAsset> => uploadAssetBuffer({
  buffer,
  ownerId: userId,
  folder: 'profile-images',
  resourceType: 'image',
  transformation: [
    {
      width: 600,
      height: 600,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    },
  ],
});

export const deleteStoredImage = async (publicId?: string): Promise<void> =>
  deleteStoredAsset(publicId, 'image');
