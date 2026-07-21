import type { RequestHandler } from 'express';
import { createSection, deleteSection, listCourseSections, reorderSection, updateSection } from '../services/section.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, requireAuth } from '../utils/request';
import type { CourseIdParams } from '../validators/course.validator';
import type { CreateSectionInput, ReorderSectionInput, SectionIdParams, UpdateSectionInput } from '../validators/section.validator';

export const createCourseSection: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const section = await createSection(requireAuth(request).userId, courseId, getValidatedBody<CreateSectionInput>(request));
  response.status(201).json(createSuccessResponse('Course section created successfully', { section }));
});
export const getCourseSections: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const { courseId } = getValidatedParams<CourseIdParams>(request);
  const sections = await listCourseSections(auth.userId, auth.role, courseId);
  response.status(200).json(createSuccessResponse('Course sections retrieved successfully', { sections }));
});
export const patchCourseSection: RequestHandler = asyncHandler(async (request, response) => {
  const { sectionId } = getValidatedParams<SectionIdParams>(request);
  const section = await updateSection(requireAuth(request).userId, sectionId, getValidatedBody<UpdateSectionInput>(request));
  response.status(200).json(createSuccessResponse('Course section updated successfully', { section }));
});
export const reorderCourseSection: RequestHandler = asyncHandler(async (request, response) => {
  const { sectionId } = getValidatedParams<SectionIdParams>(request);
  const section = await reorderSection(requireAuth(request).userId, sectionId, getValidatedBody<ReorderSectionInput>(request));
  response.status(200).json(createSuccessResponse('Course section reordered successfully', { section }));
});
export const removeCourseSection: RequestHandler = asyncHandler(async (request, response) => {
  const { sectionId } = getValidatedParams<SectionIdParams>(request);
  await deleteSection(requireAuth(request).userId, sectionId);
  response.status(200).json(createSuccessResponse('Course section deleted successfully', null));
});
