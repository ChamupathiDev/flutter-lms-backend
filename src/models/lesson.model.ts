import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  LESSON_TYPES,
  type LessonType,
} from '../constants/lms.constants';

export interface ILesson {
  courseId: Types.ObjectId;
  sectionId: Types.ObjectId;
  title: string;
  description?: string | null;
  lessonType: LessonType;
  textContent?: string | null;
  videoUrl?: string;
  videoPublicId?: string;
  documentUrl?: string;
  documentPublicId?: string;
  documentName?: string;
  durationMinutes: number;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LessonDocument =
  HydratedDocument<ILesson>;

const lessonSchema =
  new Schema<ILesson>(
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

      lessonType: {
        type:
          String,

        enum:
          Object.values(
            LESSON_TYPES,
          ),

        required:
          true,
      },

      textContent: {
        type:
          String,

        trim:
          true,

        maxlength:
          50000,
      },

      videoUrl: {
        type:
          String,

        trim:
          true,
      },

      videoPublicId: {
        type:
          String,

        trim:
          true,

        select:
          false,
      },

      documentUrl: {
        type:
          String,

        trim:
          true,
      },

      documentPublicId: {
        type:
          String,

        trim:
          true,

        select:
          false,
      },

      documentName: {
        type:
          String,

        trim:
          true,

        maxlength:
          200,
      },

      durationMinutes: {
        type:
          Number,

        default:
          0,

        min:
          0,

        max:
          1440,

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

      isPreview: {
        type:
          Boolean,

        default:
          false,

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

lessonSchema.index(
  {
    sectionId:
      1,

    order:
      1,
  },

  {
    unique:
      true,
  },
);

lessonSchema.index({
  courseId:
    1,

  isPublished:
    1,
});

export const Lesson =
  model<ILesson>(
    'Lesson',
    lessonSchema,
  );