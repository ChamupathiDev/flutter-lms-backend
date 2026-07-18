import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface IStudentProfile {
  userId: Types.ObjectId;

  dateOfBirth: Date;
  educationLevel: string;
  learningGoals: string[];

  createdAt: Date;
  updatedAt: Date;
}

export type StudentProfileDocument =
  HydratedDocument<IStudentProfile>;

const studentProfileSchema =
  new Schema<IStudentProfile>(
    {
      userId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,

        unique:
          true,

        index:
          true,
      },

      dateOfBirth: {
        type:
          Date,

        required:
          true,

        validate: {
          validator:
            (value: Date) =>
              value.getTime() <=
              Date.now(),

          message:
            'Date of birth cannot be in the future',
        },
      },

      educationLevel: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          100,
      },

      learningGoals: {
        type: [
          {
            type:
              String,

            trim:
              true,

            minlength:
              2,

            maxlength:
              150,
          },
        ],

        default:
          [],
      },
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

studentProfileSchema.index({
  educationLevel:
    1,
});

export const StudentProfile =
  model<IStudentProfile>(
    'StudentProfile',
    studentProfileSchema,
  );