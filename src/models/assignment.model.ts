import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface IAssignment {
  courseId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  title: string;
  description: string;
  instructions: string;
  dueDate?: Date;
  maximumMarks: number;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  attachmentName?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentDocument =
  HydratedDocument<IAssignment>;

const assignmentSchema =
  new Schema<IAssignment>(
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

        required:
          true,

        trim:
          true,

        minlength:
          5,

        maxlength:
          2000,
      },

      instructions: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          5,

        maxlength:
          5000,
      },

      dueDate:
        Date,

      maximumMarks: {
        type:
          Number,

        required:
          true,

        min:
          1,

        max:
          1000,
      },

      attachmentUrl: {
        type:
          String,

        trim:
          true,
      },

      attachmentPublicId: {
        type:
          String,

        trim:
          true,

        select:
          false,
      },

      attachmentName: {
        type:
          String,

        trim:
          true,

        maxlength:
          200,
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

assignmentSchema.index({
  courseId:
    1,

  isPublished:
    1,

  dueDate:
    1,
});

export const Assignment =
  model<IAssignment>(
    'Assignment',
    assignmentSchema,
  );