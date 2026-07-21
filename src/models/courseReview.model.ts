import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface ICourseReview {
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  rating: number;
  comment?: string | null;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseReviewDocument =
  HydratedDocument<ICourseReview>;

const courseReviewSchema =
  new Schema<ICourseReview>(
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

      studentId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,

        index:
          true,
      },

      rating: {
        type:
          Number,

        required:
          true,

        min:
          1,

        max:
          5,
      },

      comment: {
        type:
          String,

        trim:
          true,

        maxlength:
          1500,
      },

      isVisible: {
        type:
          Boolean,

        default:
          true,

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

courseReviewSchema.index(
  {
    courseId:
      1,

    studentId:
      1,
  },

  {
    unique:
      true,
  },
);

courseReviewSchema.index({
  courseId:
    1,

  isVisible:
    1,

  createdAt:
    -1,
});

export const CourseReview =
  model<ICourseReview>(
    'CourseReview',
    courseReviewSchema,
  );