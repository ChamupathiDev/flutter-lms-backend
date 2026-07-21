import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import {
  createLesson,
  deleteLesson,
  getLesson,
  listSectionLessons,
  removeLessonDocument,
  removeLessonVideo,
  reorderLesson,
  replaceLessonDocument,
  replaceLessonVideo,
  updateLesson,
} from '../services/lesson.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, requireAuth } from '../utils/request';
import type { CreateLessonInput, LessonIdParams, ReorderLessonInput, SectionLessonParams, UpdateLessonInput } from '../validators/lesson.validator';

export const createSectionLesson: RequestHandler = asyncHandler(async (request, response) => {
  const { sectionId } = getValidatedParams<SectionLessonParams>(request);
  const lesson = await createLesson(requireAuth(request).userId, sectionId, getValidatedBody<CreateLessonInput>(request));
  response.status(201).json(createSuccessResponse('Lesson created successfully', { lesson }));
});
export const getSectionLessons: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const { sectionId } = getValidatedParams<SectionLessonParams>(request);
  const lessons = await listSectionLessons(auth.userId, auth.role, sectionId);
  response.status(200).json(createSuccessResponse('Lessons retrieved successfully', { lessons }));
});
export const getLessonById: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await getLesson(auth.userId, auth.role, lessonId);
  response.status(200).json(createSuccessResponse('Lesson retrieved successfully', { lesson }));
});
export const patchLesson: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await updateLesson(requireAuth(request).userId, lessonId, getValidatedBody<UpdateLessonInput>(request));
  response.status(200).json(createSuccessResponse('Lesson updated successfully', { lesson }));
});
export const reorderCourseLesson: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await reorderLesson(requireAuth(request).userId, lessonId, getValidatedBody<ReorderLessonInput>(request));
  response.status(200).json(createSuccessResponse('Lesson reordered successfully', { lesson }));
});
export const uploadLessonVideo: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.file) throw new AppError('A lesson video file is required', 422, 'LESSON_VIDEO_REQUIRED');
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await replaceLessonVideo(requireAuth(request).userId, lessonId, request.file);
  response.status(200).json(createSuccessResponse('Lesson video uploaded successfully', { lesson }));
});
export const uploadLessonDocument: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.file) throw new AppError('A lesson document file is required', 422, 'LESSON_DOCUMENT_REQUIRED');
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await replaceLessonDocument(requireAuth(request).userId, lessonId, request.file);
  response.status(200).json(createSuccessResponse('Lesson document uploaded successfully', { lesson }));
});
export const deleteLessonVideo: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await removeLessonVideo(requireAuth(request).userId, lessonId);
  response.status(200).json(createSuccessResponse('Lesson video removed successfully', { lesson }));
});
export const deleteLessonDocument: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  const lesson = await removeLessonDocument(requireAuth(request).userId, lessonId);
  response.status(200).json(createSuccessResponse('Lesson document removed successfully', { lesson }));
});
export const removeLesson: RequestHandler = asyncHandler(async (request, response) => {
  const { lessonId } = getValidatedParams<LessonIdParams>(request);
  await deleteLesson(requireAuth(request).userId, lessonId);
  response.status(200).json(createSuccessResponse('Lesson deleted successfully', null));
});
