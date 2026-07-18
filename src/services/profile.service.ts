import {
  InstructorProfile,
} from '../models/instructorProfile.model';

import {
  StudentProfile,
} from '../models/studentProfile.model';

import {
  AppError,
} from '../errors/AppError';

import type {
  CreateInstructorProfileInput,
  CreateStudentProfileInput,
  UpdateInstructorProfileInput,
  UpdateStudentProfileInput,
} from '../validators/profile.validator';

import {
  toInstructorProfileResponse,
  toStudentProfileResponse,
} from '../utils/profileResponse';

const isDuplicateKeyError = (
  error: unknown,
): error is {
  code: number;
} => {
  return (
    typeof error ===
      'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
};

export const createStudentProfile =
  async (
    userId: string,
    input:
      CreateStudentProfileInput,
  ) => {
    try {
      const profile =
        await StudentProfile.create({
          userId,

          dateOfBirth:
            input.dateOfBirth,

          educationLevel:
            input.educationLevel,

          learningGoals:
            input.learningGoals,
        });

      return toStudentProfileResponse(
        profile,
      );
    } catch (error) {
      if (
        isDuplicateKeyError(error)
      ) {
        throw new AppError(
          'A student profile already exists for this user',
          409,
          'STUDENT_PROFILE_ALREADY_EXISTS',
        );
      }

      throw error;
    }
  };

export const getStudentProfile =
  async (
    userId: string,
  ) => {
    const profile =
      await StudentProfile.findOne({
        userId,
      });

    if (!profile) {
      throw new AppError(
        'Student profile not found',
        404,
        'STUDENT_PROFILE_NOT_FOUND',
      );
    }

    return toStudentProfileResponse(
      profile,
    );
  };

export const updateStudentProfile =
  async (
    userId: string,
    input:
      UpdateStudentProfileInput,
  ) => {
    const profile =
      await StudentProfile.findOneAndUpdate(
        {
          userId,
        },

        {
          $set:
            input,
        },

        {
          new:
            true,

          runValidators:
            true,
        },
      );

    if (!profile) {
      throw new AppError(
        'Student profile not found',
        404,
        'STUDENT_PROFILE_NOT_FOUND',
      );
    }

    return toStudentProfileResponse(
      profile,
    );
  };

export const deleteStudentProfile =
  async (
    userId: string,
  ): Promise<void> => {
    const result =
      await StudentProfile.deleteOne({
        userId,
      });

    if (
      result.deletedCount ===
      0
    ) {
      throw new AppError(
        'Student profile not found',
        404,
        'STUDENT_PROFILE_NOT_FOUND',
      );
    }
  };

export const createInstructorProfile =
  async (
    userId: string,
    input:
      CreateInstructorProfileInput,
  ) => {
    try {
      const profile =
        await InstructorProfile.create({
          userId,

          headline:
            input.headline,

          qualification:
            input.qualification,

          experienceYears:
            input.experienceYears,

          expertise:
            input.expertise,

          biography:
            input.biography,
        });

      return toInstructorProfileResponse(
        profile,
      );
    } catch (error) {
      if (
        isDuplicateKeyError(error)
      ) {
        throw new AppError(
          'An instructor profile already exists for this user',
          409,
          'INSTRUCTOR_PROFILE_ALREADY_EXISTS',
        );
      }

      throw error;
    }
  };

export const getInstructorProfile =
  async (
    userId: string,
  ) => {
    const profile =
      await InstructorProfile.findOne({
        userId,
      });

    if (!profile) {
      throw new AppError(
        'Instructor profile not found',
        404,
        'INSTRUCTOR_PROFILE_NOT_FOUND',
      );
    }

    return toInstructorProfileResponse(
      profile,
    );
  };

export const updateInstructorProfile =
  async (
    userId: string,
    input:
      UpdateInstructorProfileInput,
  ) => {
    const profile =
      await InstructorProfile.findOneAndUpdate(
        {
          userId,
        },

        {
          $set:
            input,
        },

        {
          new:
            true,

          runValidators:
            true,
        },
      );

    if (!profile) {
      throw new AppError(
        'Instructor profile not found',
        404,
        'INSTRUCTOR_PROFILE_NOT_FOUND',
      );
    }

    return toInstructorProfileResponse(
      profile,
    );
  };

export const deleteInstructorProfile =
  async (
    userId: string,
  ): Promise<void> => {
    const result =
      await InstructorProfile.deleteOne({
        userId,
      });

    if (
      result.deletedCount ===
      0
    ) {
      throw new AppError(
        'Instructor profile not found',
        404,
        'INSTRUCTOR_PROFILE_NOT_FOUND',
      );
    }
  };