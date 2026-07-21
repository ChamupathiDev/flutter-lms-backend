import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  ENROLLMENT_STATUSES,
  type EnrollmentStatus,
} from '../constants/lms.constants';

export interface IEnrollment {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  progressPercentage: number;
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EnrollmentDocument =
  HydratedDocument<IEnrollment>;

const enrollmentSchema =
  new Schema<IEnrollment>(
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

      status: {
        type:
          String,

        enum:
          Object.values(
            ENROLLMENT_STATUSES,
          ),

        default:
          ENROLLMENT_STATUSES
            .ACTIVE,

        required:
          true,
      },

      progressPercentage: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          100,

        required:
          true,
      },

      enrolledAt: {
        type:
          Date,

        default:
          Date.now,

        required:
          true,
      },

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

enrollmentSchema.index(
  {
    studentId:
      1,

    courseId:
      1,
  },

  {
    unique:
      true,
  },
);

enrollmentSchema.index({
  courseId:
    1,

  status:
    1,

  enrolledAt:
    -1,
});

export const Enrollment =
  model<IEnrollment>(
    'Enrollment',
    enrollmentSchema,
  );