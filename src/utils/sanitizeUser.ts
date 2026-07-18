import type {
  Types,
} from 'mongoose';

import type {
  UserRole,
  UserStatus,
} from '../constants/user.constants';

import type {
  IUser,
  UserDocument,
} from '../models/user.model';

export interface PublicUser {
  id: string;

  firstName: string;
  lastName: string;
  fullName: string;

  email: string;

  role: UserRole;
  status: UserStatus;

  emailVerified: boolean;

  profileImageUrl:
    string | null;

  bio:
    string | null;

  lastLoginAt:
    Date | null;

  createdAt: Date;
  updatedAt: Date;
}

type UserLike =
  IUser & {
    _id: Types.ObjectId;
  };

export const sanitizeUser = (
  user:
    | UserDocument
    | UserLike,
): PublicUser => ({
  id:
    user._id.toString(),

  firstName:
    user.firstName,

  lastName:
    user.lastName,

  fullName:
    `${user.firstName} ${user.lastName}`,

  email:
    user.email,

  role:
    user.role,

  status:
    user.status,

  emailVerified:
    user.emailVerified,

  profileImageUrl:
    user.profileImageUrl ?? null,

  bio:
    user.bio ?? null,

  lastLoginAt:
    user.lastLoginAt ?? null,

  createdAt:
    user.createdAt,

  updatedAt:
    user.updatedAt,
});