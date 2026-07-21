import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface ICourseSection {
  courseId: Types.ObjectId;
  title: string;
  description?: string | null;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseSectionDocument =
  HydratedDocument<ICourseSection>;

const courseSectionSchema =
  new Schema<ICourseSection>(
    {
      courseId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Course',

        required:
          true,

        index:
          true,
      },

      title: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          150,
      },

      description: {
        type:
          String,

        trim:
          true,

        maxlength:
          1000,
      },

      order: {
        type:
          Number,

        required:
          true,

        min:
          1,
      },

      isPublished: {
        type:
          Boolean,

        default:
          false,

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

courseSectionSchema.index(
  {
    courseId:
      1,

    order:
      1,
  },

  {
    unique:
      true,
  },
);

export const CourseSection =
  model<ICourseSection>(
    'CourseSection',
    courseSectionSchema,
  );