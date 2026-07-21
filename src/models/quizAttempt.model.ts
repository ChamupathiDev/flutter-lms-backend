import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  QUIZ_ATTEMPT_STATUSES,
  type QuizAttemptStatus,
} from '../constants/lms.constants';

export interface QuizAttemptAnswer {
  questionId: Types.ObjectId;
  selectedOptionIds: string[];
}

export interface IQuizAttempt {
  quizId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  answers: QuizAttemptAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  status: QuizAttemptStatus;
  startedAt: Date;
  submittedAt?: Date;
  attemptNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export type QuizAttemptDocument =
  HydratedDocument<IQuizAttempt>;

const answerSchema =
  new Schema<QuizAttemptAnswer>(
    {
      questionId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'QuizQuestion',

        required:
          true,
      },

      selectedOptionIds: [
        {
          type:
            String,

          trim:
            true,
        },
      ],
    },

    {
      _id:
        false,

      versionKey:
        false,
    },
  );

const quizAttemptSchema =
  new Schema<IQuizAttempt>(
    {
      quizId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Quiz',

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

      answers: {
        type:
          [answerSchema],

        default:
          [],
      },

      score: {
        type:
          Number,

        default:
          0,

        min:
          0,

        required:
          true,
      },

      totalMarks: {
        type:
          Number,

        default:
          0,

        min:
          0,

        required:
          true,
      },

      percentage: {
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

      passed: {
        type:
          Boolean,

        default:
          false,

        required:
          true,
      },

      status: {
        type:
          String,

        enum:
          Object.values(
            QUIZ_ATTEMPT_STATUSES,
          ),

        default:
          QUIZ_ATTEMPT_STATUSES
            .IN_PROGRESS,

        required:
          true,
      },

      startedAt: {
        type:
          Date,

        default:
          Date.now,

        required:
          true,
      },

      submittedAt:
        Date,

      attemptNumber: {
        type:
          Number,

        required:
          true,

        min:
          1,
      },
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

quizAttemptSchema.index(
  {
    quizId:
      1,

    studentId:
      1,

    attemptNumber:
      1,
  },

  {
    unique:
      true,
  },
);

export const QuizAttempt =
  model<IQuizAttempt>(
    'QuizAttempt',
    quizAttemptSchema,
  );