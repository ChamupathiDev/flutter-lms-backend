import type { RequestHandler } from 'express';
import {
  cancelMyEnrollment,
  enrollInCourse,
  getMyEnrollment,
  listCourseEnrollments,
  listEnrollmentsForAdmin,
  listMyEnrollments,
} from '../services/enrollment.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type { CourseIdParams } from '../validators/course.validator';
import type { EnrollmentIdParams, ListAdminEnrollmentsQuery, ListEnrollmentsQuery } from '../validators/enrollment.validator';

export const enrollStudentInCourse: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const enrollment = await enrollInCourse(requireAuth(request).userId, courseId);
  response.status(201).json(createSuccessResponse('Course enrollment completed successfully', { enrollment }));
});
export const getMyEnrollments: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listMyEnrollments(requireAuth(request).userId, getValidatedQuery<ListEnrollmentsQuery>(request));
  response.status(200).json(createSuccessResponse('Enrollments retrieved successfully', result));
});
export const getMyEnrollmentById: RequestHandler = asyncHandler(async (request, response) => {
  const { enrollmentId } = getValidatedParams<EnrollmentIdParams>(request);
  const enrollment = await getMyEnrollment(requireAuth(request).userId, enrollmentId);
  response.status(200).json(createSuccessResponse('Enrollment retrieved successfully', { enrollment }));
});
export const cancelEnrollment: RequestHandler = asyncHandler(async (request, response) => {
  const { enrollmentId } = getValidatedParams<EnrollmentIdParams>(request);
  const enrollment = await cancelMyEnrollment(requireAuth(request).userId, enrollmentId);
  response.status(200).json(createSuccessResponse('Enrollment cancelled successfully', { enrollment }));
});
export const getInstructorCourseEnrollments: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const result = await listCourseEnrollments(requireAuth(request).userId, courseId, getValidatedQuery<ListEnrollmentsQuery>(request));
  response.status(200).json(createSuccessResponse('Course enrollments retrieved successfully', result));
});
export const getAdminEnrollments: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listEnrollmentsForAdmin(getValidatedQuery<ListAdminEnrollmentsQuery>(request));
  response.status(200).json(createSuccessResponse('Enrollments retrieved for administration successfully', result));
});
