import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import {
  archiveCourse,
  archiveCourseForAdmin,
  createCourse,
  getInstructorCourse,
  getPublishedCourse,
  listCoursesForAdmin,
  listInstructorCourses,
  listPublishedCourses,
  publishCourse,
  removeCourseThumbnail,
  replaceCourseThumbnail,
  updateCourse,
} from '../services/course.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type {
  CourseIdParams,
  CreateCourseInput,
  ListAdminCoursesQuery,
  ListCoursesQuery,
  ListInstructorCoursesQuery,
  UpdateCourseInput,
} from '../validators/course.validator';

export const createNewCourse: RequestHandler = asyncHandler(async (request, response) => {
  const course = await createCourse(requireAuth(request).userId, getValidatedBody<CreateCourseInput>(request));
  response.status(201).json(createSuccessResponse('Course created successfully', { course }));
});
export const getPublishedCourses: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listPublishedCourses(getValidatedQuery<ListCoursesQuery>(request));
  response.status(200).json(createSuccessResponse('Published courses retrieved successfully', result));
});
export const getPublishedCourseById: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  response.status(200).json(createSuccessResponse('Course retrieved successfully', { course: await getPublishedCourse(courseId) }));
});
export const getMyInstructorCourses: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listInstructorCourses(requireAuth(request).userId, getValidatedQuery<ListInstructorCoursesQuery>(request));
  response.status(200).json(createSuccessResponse('Instructor courses retrieved successfully', result));
});
export const getMyInstructorCourse: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await getInstructorCourse(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Instructor course retrieved successfully', { course }));
});
export const patchCourse: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await updateCourse(requireAuth(request).userId, courseId, getValidatedBody<UpdateCourseInput>(request));
  response.status(200).json(createSuccessResponse('Course updated successfully', { course }));
});
export const uploadCourseThumbnail: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.file) throw new AppError('A course thumbnail file is required', 422, 'COURSE_THUMBNAIL_REQUIRED');
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await replaceCourseThumbnail(requireAuth(request).userId, courseId, request.file);
  response.status(200).json(createSuccessResponse('Course thumbnail uploaded successfully', { course }));
});
export const deleteCourseThumbnail: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await removeCourseThumbnail(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Course thumbnail removed successfully', { course }));
});
export const publishMyCourse: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await publishCourse(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Course published successfully', { course }));
});
export const archiveMyCourse: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await archiveCourse(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Course archived successfully', { course }));
});
export const getAdminCourses: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listCoursesForAdmin(getValidatedQuery<ListAdminCoursesQuery>(request));
  response.status(200).json(createSuccessResponse('Courses retrieved for administration successfully', result));
});
export const adminArchiveCourse: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const course = await archiveCourseForAdmin(courseId);
  response.status(200).json(createSuccessResponse('Course archived by administrator successfully', { course }));
});
