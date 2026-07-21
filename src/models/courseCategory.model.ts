import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface ICourseCategory {
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseCategoryDocument =
  HydratedDocument<ICourseCategory>;

const courseCategorySchema =
  new Schema<ICourseCategory>(
    {
      name: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          80,
      },

      slug: {
        type:
          String,

        required:
          true,

        unique:
          true,

        trim:
          true,

        lowercase:
          true,

        maxlength:
          100,
      },

      description: {
        type:
          String,

        trim:
          true,

        maxlength:
          500,
      },

      isActive: {
        type:
          Boolean,

        default:
          true,

        required:
          true,
      },

      createdBy: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,
      },
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

courseCategorySchema.index({
  isActive:
    1,

  name:
    1,
});

export const CourseCategory =
  model<ICourseCategory>(
    'CourseCategory',
    courseCategorySchema,
  );