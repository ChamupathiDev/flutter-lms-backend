import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  COURSE_LEVELS,
  COURSE_STATUSES,
  type CourseLevel,
  type CourseStatus,
} from '../constants/lms.constants';

export interface ICourse {
  instructorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  level: CourseLevel;
  language: string;
  isFree: boolean;
  price: number;
  requirements: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  status: CourseStatus;
  averageRating: number;
  reviewCount: number;
  totalEnrollments: number;
  publishedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseDocument =
  HydratedDocument<ICourse>;

const courseSchema =
  new Schema<ICourse>(
    {
      instructorId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,

        index:
          true,
      },

      categoryId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'CourseCategory',

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
          3,

        maxlength:
          150,
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
          180,
      },

      shortDescription: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          10,

        maxlength:
          250,
      },

      description: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          20,

        maxlength:
          5000,
      },

      thumbnailUrl: {
        type:
          String,

        trim:
          true,
      },

      thumbnailPublicId: {
        type:
          String,

        trim:
          true,

        select:
          false,
      },

      level: {
        type:
          String,

        enum:
          Object.values(
            COURSE_LEVELS,
          ),

        required:
          true,
      },

      language: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          50,
      },

      isFree: {
        type:
          Boolean,

        default:
          true,

        required:
          true,

        immutable:
          true,
      },

      price: {
        type:
          Number,

        default:
          0,

        min:
          0,

        required:
          true,

        immutable:
          true,
      },

      requirements: [
        {
          type:
            String,

          trim:
            true,

          maxlength:
            200,
        },
      ],

      learningOutcomes: [
        {
          type:
            String,

          trim:
            true,

          maxlength:
            200,
        },
      ],

      targetAudience: [
        {
          type:
            String,

          trim:
            true,

          maxlength:
            200,
        },
      ],

      status: {
        type:
          String,

        enum:
          Object.values(
            COURSE_STATUSES,
          ),

        default:
          COURSE_STATUSES
            .DRAFT,

        required:
          true,

        index:
          true,
      },

      averageRating: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          5,

        required:
          true,
      },

      reviewCount: {
        type:
          Number,

        default:
          0,

        min:
          0,

        required:
          true,
      },

      totalEnrollments: {
        type:
          Number,

        default:
          0,

        min:
          0,

        required:
          true,
      },

      publishedAt:
        Date,

      archivedAt:
        Date,
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

courseSchema.index({
  status:
    1,

  categoryId:
    1,

  level:
    1,

  createdAt:
    -1,
});

courseSchema.index({
  instructorId:
    1,

  status:
    1,

  createdAt:
    -1,
});

courseSchema.index({
  title:
    'text',

  shortDescription:
    'text',

  description:
    'text',
});

export const Course =
  model<ICourse>(
    'Course',
    courseSchema,
  );