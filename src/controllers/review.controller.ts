import type { RequestHandler } from 'express';
import {
  createReview,
  deleteMyReview,
  listCourseReviews,
  updateMyReview,
  updateReviewVisibility,
} from '../services/review.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type {
  CourseReviewParams,
  CreateReviewInput,
  ListReviewsQuery,
  ReviewIdParams,
  UpdateReviewInput,
  UpdateReviewVisibilityInput,
} from '../validators/review.validator';

export const createCourseReview: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseReviewParams>(request);
  const review = await createReview(requireAuth(request).userId, courseId, getValidatedBody<CreateReviewInput>(request));
  response.status(201).json(createSuccessResponse('Course review created successfully', { review }));
});
export const getCourseReviews: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseReviewParams>(request);
  const result = await listCourseReviews(courseId, getValidatedQuery<ListReviewsQuery>(request));
  response.status(200).json(createSuccessResponse('Course reviews retrieved successfully', result));
});
export const patchMyCourseReview: RequestHandler = asyncHandler(async (request, response) => {
  const { reviewId } = getValidatedParams<ReviewIdParams>(request);
  const review = await updateMyReview(requireAuth(request).userId, reviewId, getValidatedBody<UpdateReviewInput>(request));
  response.status(200).json(createSuccessResponse('Course review updated successfully', { review }));
});
export const removeMyCourseReview: RequestHandler = asyncHandler(async (request, response) => {
  const { reviewId } = getValidatedParams<ReviewIdParams>(request);
  await deleteMyReview(requireAuth(request).userId, reviewId);
  response.status(200).json(createSuccessResponse('Course review deleted successfully', null));
});
export const patchReviewVisibility: RequestHandler = asyncHandler(async (request, response) => {
  const { reviewId } = getValidatedParams<ReviewIdParams>(request);
  const review = await updateReviewVisibility(reviewId, getValidatedBody<UpdateReviewVisibilityInput>(request));
  response.status(200).json(createSuccessResponse('Course review visibility updated successfully', { review }));
});
