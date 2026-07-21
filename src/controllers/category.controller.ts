import type { RequestHandler } from 'express';
import {
  createCategory,
  getCategory,
  listCategories,
  updateCategory,
  updateCategoryStatus,
} from '../services/category.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type {
  CategoryIdParams,
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from '../validators/category.validator';

export const createCourseCategory: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const category = await createCategory(auth.userId, getValidatedBody<CreateCategoryInput>(request));
  response.status(201).json(createSuccessResponse('Course category created successfully', { category }));
});

export const getCourseCategories: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listCategories(getValidatedQuery<ListCategoriesQuery>(request));
  response.status(200).json(createSuccessResponse('Course categories retrieved successfully', result));
});

export const getCourseCategory: RequestHandler = asyncHandler(async (request, response) => {
  const { categoryId } = getValidatedParams<CategoryIdParams>(request);
  const category = await getCategory(categoryId);
  response.status(200).json(createSuccessResponse('Course category retrieved successfully', { category }));
});

export const patchCourseCategory: RequestHandler = asyncHandler(async (request, response) => {
  const { categoryId } = getValidatedParams<CategoryIdParams>(request);
  const category = await updateCategory(categoryId, getValidatedBody<UpdateCategoryInput>(request));
  response.status(200).json(createSuccessResponse('Course category updated successfully', { category }));
});

export const patchCourseCategoryStatus: RequestHandler = asyncHandler(async (request, response) => {
  const { categoryId } = getValidatedParams<CategoryIdParams>(request);
  const category = await updateCategoryStatus(categoryId, getValidatedBody<UpdateCategoryStatusInput>(request));
  response.status(200).json(createSuccessResponse('Course category status updated successfully', { category }));
});
