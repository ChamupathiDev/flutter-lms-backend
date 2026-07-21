import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from '../constants/lms.constants';

export interface IAssignmentSubmission {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  textAnswer?: string | null;
  fileUrl?: string;
  filePublicId?: string;
  fileName?: string;
  status: SubmissionStatus;
  submittedAt: Date;
  marksAwarded?: number;
  feedback?: string | null;
  gradedAt?: Date;
  gradedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentSubmissionDocument =
  HydratedDocument<IAssignmentSubmission>;

const assignmentSubmissionSchema =
  new Schema<IAssignmentSubmission>(
    {
      assignmentId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Assignment',

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

      enrollmentId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Enrollment',

        required:
          true,
      },

      textAnswer: {
        type:
          String,

        trim:
          true,

        maxlength:
          10000,
      },

      fileUrl: {
        type:
          String,

        trim:
          true,
      },

      filePublicId: {
        type:
          String,

        trim:
          true,

        select:
          false,
      },

      fileName: {
        type:
          String,

        trim:
          true,

        maxlength:
          200,
      },

      status: {
        type:
          String,

        enum:
          Object.values(
            SUBMISSION_STATUSES,
          ),

        required:
          true,
      },

      submittedAt: {
        type:
          Date,

        default:
          Date.now,

        required:
          true,
      },

      marksAwarded: {
        type:
          Number,

        min:
          0,
      },

      feedback: {
        type:
          String,

        trim:
          true,

        maxlength:
          3000,
      },

      gradedAt:
        Date,

      gradedBy: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',
      },
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

assignmentSubmissionSchema.index(
  {
    assignmentId:
      1,

    studentId:
      1,
  },

  {
    unique:
      true,
  },
);

export const AssignmentSubmission =
  model<IAssignmentSubmission>(
    'AssignmentSubmission',
    assignmentSubmissionSchema,
  );