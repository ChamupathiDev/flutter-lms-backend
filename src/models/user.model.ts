import {
  Schema,
  model,
  type HydratedDocument,
} from 'mongoose';

import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from '../constants/user.constants';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;

  passwordHash: string;

  role: UserRole;
  status: UserStatus;

  emailVerified: boolean;

  profileImageUrl?: string;
  profileImagePublicId?: string;

  bio?: string | null;

  tokenVersion: number;

  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },

    profileImageUrl: {
      type: String,
      trim: true,
    },

    profileImagePublicId: {
      type: String,
      trim: true,
      select: false,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
      required: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({
  role: 1,
  status: 1,
});

userSchema.index({
  createdAt: -1,
});

export const User = model<IUser>(
  'User',
  userSchema,
);