import type { RequestHandler } from 'express';
import { completeLesson, getEnrollmentProgress, getMyCourseProgress, startLesson } from '../services/progress.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedParams, requireAuth } from '../utils/request';
import type { CourseProgressParams, EnrollmentProgressParams, LessonProgressParams } from '../validators/progress.validator';

export const startMyLesson: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonProgressParams>(request);
  const lessonProgress = await startLesson(requireAuth(request).userId, lessonId);
  response.status(200).json(createSuccessResponse('Lesson started successfully', { lessonProgress }));
});
export const completeMyLesson: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonProgressParams>(request);
  const result = await completeLesson(requireAuth(request).userId, lessonId);
  response.status(200).json(createSuccessResponse('Lesson completed successfully', result));
});
export const getCourseProgressForMe: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseProgressParams>(request);
  const result = await getMyCourseProgress(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Course progress retrieved successfully', result));
});
export const getEnrollmentProgressForMe: RequestHandler = asyncHandler(async (request, response) => {
  const { enrollmentId } = getValidatedParams<EnrollmentProgressParams>(request);
  const result = await getEnrollmentProgress(requireAuth(request).userId, enrollmentId);
  response.status(200).json(createSuccessResponse('Enrollment progress retrieved successfully', result));
});
