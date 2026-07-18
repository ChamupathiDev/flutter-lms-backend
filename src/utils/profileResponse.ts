import type {
  Types,
} from 'mongoose';

import type {
  IStudentProfile,
  StudentProfileDocument,
} from '../models/studentProfile.model';

import type {
  IInstructorProfile,
  InstructorProfileDocument,
} from '../models/instructorProfile.model';

type StudentProfileLike =
  IStudentProfile & {
    _id: Types.ObjectId;
  };

type InstructorProfileLike =
  IInstructorProfile & {
    _id: Types.ObjectId;
  };

export interface StudentProfileResponse {
  id: string;
  userId: string;

  dateOfBirth: Date;
  educationLevel: string;
  learningGoals: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorProfileResponse {
  id: string;
  userId: string;

  headline: string;
  qualification: string;
  experienceYears: number;
  expertise: string[];
  biography: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const toStudentProfileResponse = (
  profile:
    | StudentProfileDocument
    | StudentProfileLike,
): StudentProfileResponse => ({
  id:
    profile._id.toString(),

  userId:
    profile.userId.toString(),

  dateOfBirth:
    profile.dateOfBirth,

  educationLevel:
    profile.educationLevel,

  learningGoals:
    profile.learningGoals,

  createdAt:
    profile.createdAt,

  updatedAt:
    profile.updatedAt,
});

export const toInstructorProfileResponse = (
  profile:
    | InstructorProfileDocument
    | InstructorProfileLike,
): InstructorProfileResponse => ({
  id:
    profile._id.toString(),

  userId:
    profile.userId.toString(),

  headline:
    profile.headline,

  qualification:
    profile.qualification,

  experienceYears:
    profile.experienceYears,

  expertise:
    profile.expertise,

  biography:
    profile.biography ?? null,

  createdAt:
    profile.createdAt,

  updatedAt:
    profile.updatedAt,
});