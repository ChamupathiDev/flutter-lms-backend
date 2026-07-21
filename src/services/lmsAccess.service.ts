import { COURSE_STATUSES, ENROLLMENT_STATUSES } from '../constants/lms.constants';
import { USER_ROLES, type UserRole } from '../constants/user.constants';
import { AppError } from '../errors/AppError';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';

export const getCourseOrThrow = async (courseId: string, includePrivateFields = false) => {
  const query = Course.findById(courseId);
  if (includePrivateFields) {
    query.select('+thumbnailPublicId');
  }
  const course = await query;
  if (!course) {
    throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
  }
  return course;
};

export const getOwnedCourseOrThrow = async (
  courseId: string,
  instructorId: string,
  includePrivateFields = false,
) => {
  const course = await getCourseOrThrow(courseId, includePrivateFields);
  if (course.instructorId.toString() !== instructorId) {
    throw new AppError(
      'You can manage only your own courses',
      403,
      'COURSE_OWNERSHIP_REQUIRED',
    );
  }
  return course;
};

export const getEnrollmentOrThrow = async (studentId: string, courseId: string) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId });
  if (!enrollment || enrollment.status === ENROLLMENT_STATUSES.CANCELLED) {
    throw new AppError(
      'An active course enrollment is required',
      403,
      'ACTIVE_ENROLLMENT_REQUIRED',
    );
  }
  return enrollment;
};

export const assertCourseContentAccess = async (
  userId: string,
  role: UserRole,
  courseId: string,
) => {
  const course = await getCourseOrThrow(courseId);

  if (role === USER_ROLES.ADMIN) {
    return { course, enrollment: null };
  }

  if (role === USER_ROLES.INSTRUCTOR) {
    if (course.instructorId.toString() !== userId) {
      throw new AppError(
        'You can access only content belonging to your own courses',
        403,
        'COURSE_OWNERSHIP_REQUIRED',
      );
    }
    return { course, enrollment: null };
  }

  if (course.status !== COURSE_STATUSES.PUBLISHED) {
    throw new AppError('This course is not published', 403, 'COURSE_NOT_PUBLISHED');
  }

  const enrollment = await getEnrollmentOrThrow(userId, courseId);
  return { course, enrollment };
};
