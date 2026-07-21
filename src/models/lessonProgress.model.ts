import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  LESSON_PROGRESS_STATUSES,
  type LessonProgressStatus,
} from '../constants/lms.constants';

export interface ILessonProgress {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  status: LessonProgressStatus;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LessonProgressDocument =
  HydratedDocument<ILessonProgress>;

const lessonProgressSchema =
  new Schema<ILessonProgress>(
    {
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

      lessonId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Lesson',

        required:
          true,

        index:
          true,
      },

      enrollmentId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Enrollment',

        required:
          true,

        index:
          true,
      },

      status: {
        type:
          String,

        enum:
          Object.values(
            LESSON_PROGRESS_STATUSES,
          ),

        default:
          LESSON_PROGRESS_STATUSES
            .NOT_STARTED,

        required:
          true,
      },

      startedAt:
        Date,

      completedAt:
        Date,

      lastAccessedAt:
        Date,
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

lessonProgressSchema.index(
  {
    studentId:
      1,

    lessonId:
      1,
  },

  {
    unique:
      true,
  },
);

lessonProgressSchema.index({
  enrollmentId:
    1,

  status:
    1,
});

export const LessonProgress =
  model<ILessonProgress>(
    'LessonProgress',
    lessonProgressSchema,
  );