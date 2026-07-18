import bcrypt from 'bcrypt';

import type {
  QueryFilter,
} from 'mongoose';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../constants/user.constants';

import { environment } from '../config/environment';
import { AppError } from '../errors/AppError';

import {
  InstructorProfile,
} from '../models/instructorProfile.model';

import {
  StudentProfile,
} from '../models/studentProfile.model';

import {
  User,
  type IUser,
} from '../models/user.model';

import type {
  ChangePasswordInput,
  ListUsersQuery,
  UpdateProfileInput,
  UpdateUserStatusInput,
} from '../validators/user.validator';

import {
  escapeRegex,
} from '../utils/escapeRegex';

import {
  createPaginationMetadata,
  getPagination,
} from '../utils/pagination';

import {
  toInstructorProfileResponse,
  toStudentProfileResponse,
} from '../utils/profileResponse';

import {
  sanitizeUser,
} from '../utils/sanitizeUser';

import {
  deleteStoredImage,
  uploadProfileImageBuffer,
} from './fileUpload.service';

import {
  revokeAllUserSessions,
} from './token.service';

export const getCurrentUser =
  async (
    userId: string,
  ) => {
    const user =
      await User.findById(
        userId,
      );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    return sanitizeUser(
      user,
    );
  };

export const getCurrentFullProfile =
  async (
    userId: string,
  ) => {
    const user =
      await User.findById(
        userId,
      );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    if (
      user.role ===
      USER_ROLES.STUDENT
    ) {
      const studentProfile =
        await StudentProfile.findOne({
          userId:
            user._id,
        });

      return {
        user:
          sanitizeUser(user),

        profile:
          studentProfile
            ? toStudentProfileResponse(
                studentProfile,
              )
            : null,
      };
    }

    if (
      user.role ===
      USER_ROLES.INSTRUCTOR
    ) {
      const instructorProfile =
        await InstructorProfile.findOne({
          userId:
            user._id,
        });

      return {
        user:
          sanitizeUser(user),

        profile:
          instructorProfile
            ? toInstructorProfileResponse(
                instructorProfile,
              )
            : null,
      };
    }

    return {
      user:
        sanitizeUser(user),

      profile:
        null,
    };
  };

export const updateCurrentUser =
  async (
    userId: string,

    input:
      UpdateProfileInput,
  ) => {
    const updates:
      Partial<
        Pick<
          IUser,
          | 'firstName'
          | 'lastName'
          | 'bio'
        >
      > = {};

    if (
      input.firstName !==
      undefined
    ) {
      updates.firstName =
        input.firstName;
    }

    if (
      input.lastName !==
      undefined
    ) {
      updates.lastName =
        input.lastName;
    }

    if (
      input.bio !==
      undefined
    ) {
      updates.bio =
        input.bio;
    }

    const user =
      await User
        .findByIdAndUpdate(
          userId,

          {
            $set:
              updates,
          },

          {
            new:
              true,

            runValidators:
              true,
          },
        );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    return sanitizeUser(
      user,
    );
  };

export const changeCurrentUserPassword =
  async (
    userId: string,

    input:
      ChangePasswordInput,
  ): Promise<void> => {
    const user =
      await User
        .findById(
          userId,
        )
        .select(
          '+passwordHash +tokenVersion',
        );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        input.currentPassword,
        user.passwordHash,
      );

    if (
      !currentPasswordMatches
    ) {
      throw new AppError(
        'The current password is incorrect',
        400,
        'CURRENT_PASSWORD_INCORRECT',
      );
    }

    user.passwordHash =
      await bcrypt.hash(
        input.newPassword,

        environment
          .BCRYPT_ROUNDS,
      );

    user.tokenVersion += 1;

    await user.save();

    await revokeAllUserSessions(
      user.id,
    );
  };

export const replaceCurrentUserProfileImage =
  async (
    userId: string,
    fileBuffer: Buffer,
  ) => {
    const user =
      await User
        .findById(
          userId,
        )
        .select(
          '+profileImagePublicId',
        );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    const oldPublicId =
      user
        .profileImagePublicId;

    const uploadedImage =
      await uploadProfileImageBuffer(
        fileBuffer,
        userId,
      );

    try {
      user.profileImageUrl =
        uploadedImage.url;

      user.profileImagePublicId =
        uploadedImage.publicId;

      await user.save();
    } catch (error) {
      await deleteStoredImage(
        uploadedImage.publicId,
      );

      throw error;
    }

    await deleteStoredImage(
      oldPublicId,
    );

    return sanitizeUser(
      user,
    );
  };

export const removeCurrentUserProfileImage =
  async (
    userId: string,
  ) => {
    const user =
      await User
        .findById(
          userId,
        )
        .select(
          '+profileImagePublicId',
        );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    const oldPublicId =
      user
        .profileImagePublicId;

    user.profileImageUrl =
      undefined;

    user.profileImagePublicId =
      undefined;

    await user.save();

    await deleteStoredImage(
      oldPublicId,
    );

    return sanitizeUser(
      user,
    );
  };

export const deactivateCurrentUser =
  async (
    userId: string,
  ): Promise<void> => {
    const user =
      await User
        .findById(
          userId,
        )
        .select(
          '+tokenVersion',
        );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    user.status =
      USER_STATUSES.INACTIVE;

    user.tokenVersion += 1;

    await user.save();

    await revokeAllUserSessions(
      user.id,
    );
  };

export const listUsers =
  async (
    query:
      ListUsersQuery,
  ) => {
    const filter:
      QueryFilter<IUser> = {};

    if (query.role) {
      filter.role =
        query.role;
    }

    if (query.status) {
      filter.status =
        query.status;
    }

    if (query.search) {
      const safeSearch =
        escapeRegex(
          query.search,
        );

      filter.$or = [
        {
          firstName: {
            $regex:
              safeSearch,

            $options:
              'i',
          },
        },

        {
          lastName: {
            $regex:
              safeSearch,

            $options:
              'i',
          },
        },

        {
          email: {
            $regex:
              safeSearch,

            $options:
              'i',
          },
        },
      ];
    }

    const pagination =
      getPagination(
        query,
      );

    const [
      users,
      totalItems,
    ] = await Promise.all([
      User
        .find(filter)
        .sort({
          createdAt:
            -1,
        })
        .skip(
          pagination.skip,
        )
        .limit(
          pagination.limit,
        )
        .lean(),

      User
        .countDocuments(
          filter,
        ),
    ]);

    return {
      users:
        users.map(
          (user) =>
            sanitizeUser(
              user,
            ),
        ),

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          totalItems,
        ),
    };
  };

export const getUserByIdForAdmin =
  async (
    userId: string,
  ) => {
    const user =
      await User.findById(
        userId,
      );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    return sanitizeUser(
      user,
    );
  };

export const updateUserStatusForAdmin =
  async (
    actingAdminId:
      string,

    userId:
      string,

    input:
      UpdateUserStatusInput,
  ) => {
    if (
      actingAdminId ===
      userId
    ) {
      throw new AppError(
        'You cannot change your own account status',
        409,
        'SELF_STATUS_CHANGE_NOT_ALLOWED',
      );
    }

    const user =
      await User
        .findById(
          userId,
        )
        .select(
          '+tokenVersion',
        );

    if (!user) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
      );
    }

    user.status =
      input.status;

    user.tokenVersion += 1;

    await user.save();

    if (
      input.status !==
      USER_STATUSES.ACTIVE
    ) {
      await revokeAllUserSessions(
        user.id,
      );
    }

    return sanitizeUser(
      user,
    );
  };
