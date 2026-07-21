import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface IQuiz {
  courseId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  title: string;
  description?: string | null;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QuizDocument =
  HydratedDocument<IQuiz>;

const quizSchema =
  new Schema<IQuiz>(
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

      sectionId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'CourseSection',

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

      passingScore: {
        type:
          Number,

        required:
          true,

        min:
          0,

        max:
          100,
      },

      timeLimitMinutes: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          600,

        required:
          true,
      },

      maxAttempts: {
        type:
          Number,

        default:
          1,

        min:
          1,

        max:
          20,

        required:
          true,
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

quizSchema.index({
  courseId:
    1,

  isPublished:
    1,

  createdAt:
    -1,
});

export const Quiz =
  model<IQuiz>(
    'Quiz',
    quizSchema,
  );