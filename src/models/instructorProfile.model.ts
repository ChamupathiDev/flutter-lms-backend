import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

export interface IInstructorProfile {
  userId: Types.ObjectId;

  headline: string;
  qualification: string;
  experienceYears: number;
  expertise: string[];
  biography?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type InstructorProfileDocument =
  HydratedDocument<IInstructorProfile>;

const instructorProfileSchema =
  new Schema<IInstructorProfile>(
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

      headline: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          120,
      },

      qualification: {
        type:
          String,

        required:
          true,

        trim:
          true,

        minlength:
          2,

        maxlength:
          200,
      },

      experienceYears: {
        type:
          Number,

        required:
          true,

        min:
          0,

        max:
          80,
      },

      expertise: {
        type: [
          {
            type:
              String,

            trim:
              true,

            minlength:
              2,

            maxlength:
              80,
          },
        ],

        required:
          true,

        validate: {
          validator:
            (values: string[]) =>
              values.length > 0 &&
              values.length <= 20,

          message:
            'Expertise must contain between 1 and 20 items',
        },
      },

      biography: {
        type:
          String,

        trim:
          true,

        maxlength:
          1000,
      },
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

instructorProfileSchema.index({
  expertise:
    1,
});

export const InstructorProfile =
  model<IInstructorProfile>(
    'InstructorProfile',
    instructorProfileSchema,
  );