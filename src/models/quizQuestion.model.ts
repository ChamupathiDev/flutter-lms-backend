import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  QUIZ_QUESTION_TYPES,
  type QuizQuestionType,
} from '../constants/lms.constants';

export interface QuizOption {
  id: string;
  text: string;
}

export interface IQuizQuestion {
  quizId: Types.ObjectId;
  questionText: string;
  questionType: QuizQuestionType;
  options: QuizOption[];
  correctOptionIds: string[];
  marks: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type QuizQuestionDocument =
  HydratedDocument<IQuizQuestion>;

const quizOptionSchema =
  new Schema<QuizOption>(
    {
      id: {
        type:
          String,

        required:
          true,

        trim:
          true,
      },

      text: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          500,
      },
    },

    {
      _id:
        false,

      versionKey:
        false,
    },
  );

const quizQuestionSchema =
  new Schema<IQuizQuestion>(
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

      questionText: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          2000,
      },

      questionType: {
        type:
          String,

        enum:
          Object.values(
            QUIZ_QUESTION_TYPES,
          ),

        required:
          true,
      },

      options: {
        type:
          [quizOptionSchema],

        required:
          true,
      },

      correctOptionIds: [
        {
          type:
            String,

          required:
            true,

          trim:
            true,
        },
      ],

      marks: {
        type:
          Number,

        default:
          1,

        min:
          0.5,

        max:
          100,

        required:
          true,
      },

      order: {
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

quizQuestionSchema.index(
  {
    quizId:
      1,

    order:
      1,
  },

  {
    unique:
      true,
  },
);

export const QuizQuestion =
  model<IQuizQuestion>(
    'QuizQuestion',
    quizQuestionSchema,
  );