import type { QueryFilter } from 'mongoose';
import { COURSE_STATUSES, ENROLLMENT_STATUSES, NOTIFICATION_TYPES, RELATED_ENTITY_TYPES } from '../constants/lms.constants';
import { AppError } from '../errors/AppError';
import { Course } from '../models/course.model';
import { Enrollment, type IEnrollment } from '../models/enrollment.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import type { ListAdminEnrollmentsQuery, ListEnrollmentsQuery } from '../validators/enrollment.validator';
import { getOwnedCourseOrThrow } from './lmsAccess.service';
import { createNotification } from './notification.service';

export const enrollInCourse = async (studentId: string, courseId: string) => {
  const course = await Course.findOne({ _id: courseId, status: COURSE_STATUSES.PUBLISHED });
  if (!course) throw new AppError('Published course not found', 404, 'COURSE_NOT_FOUND');

  const existing = await Enrollment.findOne({ studentId, courseId });
  if (existing && existing.status !== ENROLLMENT_STATUSES.CANCELLED) {
    throw new AppError('You are already enrolled in this course', 409, 'ALREADY_ENROLLED');
  }

  let enrollment;
  if (existing) {
    existing.status = ENROLLMENT_STATUSES.ACTIVE;
    existing.enrolledAt = new Date();
    existing.completedAt = undefined;
    enrollment = await existing.save();
  } else {
    enrollment = await Enrollment.create({ studentId, courseId });
  }

  await Course.updateOne({ _id: courseId }, { $inc: { totalEnrollments: 1 } });
  await createNotification({
    userId: studentId,
    type: NOTIFICATION_TYPES.ENROLLMENT_CONFIRMED,
    title: 'Enrollment confirmed',
    message: `You are now enrolled in ${course.title}.`,
    relatedEntityType: RELATED_ENTITY_TYPES.ENROLLMENT,
    relatedEntityId: enrollment._id,
  });
  return normalizeMongo(await enrollment.populate('courseId', 'title thumbnailUrl level language status'));
};

export const listMyEnrollments = async (studentId: string, query: ListEnrollmentsQuery) => {
  const filter: QueryFilter<IEnrollment> = { studentId };
  if (query.status) filter.status = query.status;
  const pagination = getPagination(query);
  const [enrollments, totalItems] = await Promise.all([
    Enrollment.find(filter).populate('courseId', 'title thumbnailUrl level language status averageRating').sort({ enrolledAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Enrollment.countDocuments(filter),
  ]);
  return { enrollments: normalizeMongo(enrollments), pagination: createPaginationMetadata(query.page, query.limit, totalItems) };
};

export const getMyEnrollment = async (studentId: string, enrollmentId: string) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, studentId }).populate('courseId', 'title thumbnailUrl level language status averageRating');
  if (!enrollment) throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
  return normalizeMongo(enrollment);
};

export const cancelMyEnrollment = async (studentId: string, enrollmentId: string) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, studentId });
  if (!enrollment) throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
  if (enrollment.status === ENROLLMENT_STATUSES.COMPLETED) {
    throw new AppError('A completed enrollment cannot be cancelled', 409, 'COMPLETED_ENROLLMENT');
  }
  if (enrollment.status === ENROLLMENT_STATUSES.CANCELLED) {
    throw new AppError('This enrollment is already cancelled', 409, 'ENROLLMENT_ALREADY_CANCELLED');
  }
  enrollment.status = ENROLLMENT_STATUSES.CANCELLED;
  await enrollment.save();
  await Course.updateOne({ _id: enrollment.courseId, totalEnrollments: { $gt: 0 } }, { $inc: { totalEnrollments: -1 } });
  return normalizeMongo(enrollment);
};

export const listCourseEnrollments = async (instructorId: string, courseId: string, query: ListEnrollmentsQuery) => {
  await getOwnedCourseOrThrow(courseId, instructorId);
  const filter: QueryFilter<IEnrollment> = { courseId };
  if (query.status) filter.status = query.status;
  const pagination = getPagination(query);
  const [enrollments, totalItems] = await Promise.all([
    Enrollment.find(filter).populate('studentId', 'firstName lastName email profileImageUrl').sort({ enrolledAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Enrollment.countDocuments(filter),
  ]);
  return { enrollments: normalizeMongo(enrollments), pagination: createPaginationMetadata(query.page, query.limit, totalItems) };
};

export const listEnrollmentsForAdmin = async (query: ListAdminEnrollmentsQuery) => {
  const filter: QueryFilter<IEnrollment> = {};
  if (query.status) filter.status = query.status;
  if (query.courseId) filter.courseId = query.courseId;
  if (query.studentId) filter.studentId = query.studentId;
  const pagination = getPagination(query);
  const [enrollments, totalItems] = await Promise.all([
    Enrollment.find(filter)
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title status')
      .sort({ enrolledAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Enrollment.countDocuments(filter),
  ]);
  return { enrollments: normalizeMongo(enrollments), pagination: createPaginationMetadata(query.page, query.limit, totalItems) };
};
