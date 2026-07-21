import { Types } from 'mongoose';
import { AppError } from '../errors/AppError';
import { Course } from '../models/course.model';
import { CourseReview } from '../models/courseReview.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import type { CreateReviewInput, ListReviewsQuery, UpdateReviewInput, UpdateReviewVisibilityInput } from '../validators/review.validator';
import { getEnrollmentOrThrow } from './lmsAccess.service';

const recalculateCourseRating = async (courseId: string) => {
  const [summary] = await CourseReview.aggregate<{ averageRating: number; reviewCount: number }>([
    { $match: { courseId: new Types.ObjectId(courseId), isVisible: true } },
    { $group: { _id: '$courseId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  await Course.updateOne(
    { _id: courseId },
    { $set: { averageRating: summary ? Math.round(summary.averageRating * 100) / 100 : 0, reviewCount: summary?.reviewCount ?? 0 } },
  );
};

export const createReview = async (studentId: string, courseId: string, input: CreateReviewInput) => {
  await getEnrollmentOrThrow(studentId, courseId);
  if (await CourseReview.exists({ courseId, studentId })) {
    throw new AppError('You have already reviewed this course', 409, 'COURSE_ALREADY_REVIEWED');
  }
  const review = await CourseReview.create({ courseId, studentId, ...input });
  await recalculateCourseRating(courseId);
  return normalizeMongo(review);
};

export const listCourseReviews = async (courseId: string, query: ListReviewsQuery) => {
  if (!await Course.exists({ _id: courseId })) throw new AppError('Course not found', 404, 'COURSE_NOT_FOUND');
  const pagination = getPagination(query);
  const [reviews, totalItems] = await Promise.all([
    CourseReview.find({ courseId, isVisible: true }).populate('studentId', 'firstName lastName profileImageUrl').sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    CourseReview.countDocuments({ courseId, isVisible: true }),
  ]);
  return { reviews: normalizeMongo(reviews), pagination: createPaginationMetadata(query.page, query.limit, totalItems) };
};

export const updateMyReview = async (studentId: string, reviewId: string, input: UpdateReviewInput) => {
  const review = await CourseReview.findOne({ _id: reviewId, studentId });
  if (!review) throw new AppError('Course review not found', 404, 'REVIEW_NOT_FOUND');
  if (input.rating !== undefined) review.rating = input.rating;
  if (input.comment !== undefined) review.comment = input.comment;
  await review.save();
  await recalculateCourseRating(review.courseId.toString());
  return normalizeMongo(review);
};

export const deleteMyReview = async (studentId: string, reviewId: string) => {
  const review = await CourseReview.findOneAndDelete({ _id: reviewId, studentId });
  if (!review) throw new AppError('Course review not found', 404, 'REVIEW_NOT_FOUND');
  await recalculateCourseRating(review.courseId.toString());
};

export const updateReviewVisibility = async (reviewId: string, input: UpdateReviewVisibilityInput) => {
  const review = await CourseReview.findByIdAndUpdate(reviewId, { $set: { isVisible: input.isVisible } }, { new: true, runValidators: true });
  if (!review) throw new AppError('Course review not found', 404, 'REVIEW_NOT_FOUND');
  await recalculateCourseRating(review.courseId.toString());
  return normalizeMongo(review);
};
