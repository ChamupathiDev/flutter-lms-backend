import type { RequestHandler } from 'express';
import {
  createQuiz,
  createQuizQuestion,
  deleteQuiz,
  deleteQuizQuestion,
  getInstructorQuiz,
  getStudentQuiz,
  listInstructorQuizzes,
  listMyQuizAttempts,
  listQuizAttemptsForInstructor,
  listStudentQuizzes,
  publishQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  updateQuiz,
  updateQuizQuestion,
} from '../services/quiz.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type {
  CourseQuizParams,
  CreateQuizInput,
  CreateQuizQuestionInput,
  QuizAttemptIdParams,
  QuizIdParams,
  QuizQuestionIdParams,
  SubmitQuizAttemptInput,
  UpdateQuizInput,
  UpdateQuizQuestionInput,
} from '../validators/quiz.validator';
import type { PaginationInput } from '../utils/pagination';

export const createCourseQuiz: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseQuizParams>(request);
  const quiz = await createQuiz(requireAuth(request).userId, courseId, getValidatedBody<CreateQuizInput>(request));
  response.status(201).json(createSuccessResponse('Quiz created successfully', { quiz }));
});
export const getInstructorCourseQuizzes: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseQuizParams>(request);
  const quizzes = await listInstructorQuizzes(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Instructor quizzes retrieved successfully', { quizzes }));
});
export const getInstructorQuizById: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const result = await getInstructorQuiz(requireAuth(request).userId, quizId);
  response.status(200).json(createSuccessResponse('Quiz retrieved successfully', result));
});
export const patchQuiz: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const quiz = await updateQuiz(requireAuth(request).userId, quizId, getValidatedBody<UpdateQuizInput>(request));
  response.status(200).json(createSuccessResponse('Quiz updated successfully', { quiz }));
});
export const removeQuiz: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  await deleteQuiz(requireAuth(request).userId, quizId);
  response.status(200).json(createSuccessResponse('Quiz deleted successfully', null));
});
export const addQuizQuestion: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const question = await createQuizQuestion(requireAuth(request).userId, quizId, getValidatedBody<CreateQuizQuestionInput>(request));
  response.status(201).json(createSuccessResponse('Quiz question created successfully', { question }));
});
export const patchQuizQuestion: RequestHandler = asyncHandler(async (request, response) => {
  const { questionId } = getValidatedParams<QuizQuestionIdParams>(request);
  const question = await updateQuizQuestion(requireAuth(request).userId, questionId, getValidatedBody<UpdateQuizQuestionInput>(request));
  response.status(200).json(createSuccessResponse('Quiz question updated successfully', { question }));
});
export const removeQuizQuestion: RequestHandler = asyncHandler(async (request, response) => {
  const { questionId } = getValidatedParams<QuizQuestionIdParams>(request);
  await deleteQuizQuestion(requireAuth(request).userId, questionId);
  response.status(200).json(createSuccessResponse('Quiz question deleted successfully', null));
});
export const publishCourseQuiz: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const quiz = await publishQuiz(requireAuth(request).userId, quizId);
  response.status(200).json(createSuccessResponse('Quiz published successfully', { quiz }));
});
export const getStudentCourseQuizzes: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseQuizParams>(request);
  const quizzes = await listStudentQuizzes(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Course quizzes retrieved successfully', { quizzes }));
});
export const getStudentQuizById: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const result = await getStudentQuiz(requireAuth(request).userId, quizId);
  response.status(200).json(createSuccessResponse('Quiz retrieved successfully', result));
});
export const startStudentQuizAttempt: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const attempt = await startQuizAttempt(requireAuth(request).userId, quizId);
  response.status(201).json(createSuccessResponse('Quiz attempt started successfully', { attempt }));
});
export const submitStudentQuizAttempt: RequestHandler = asyncHandler(async (request, response) => {
  const { attemptId } = getValidatedParams<QuizAttemptIdParams>(request);
  const result = await submitQuizAttempt(requireAuth(request).userId, attemptId, getValidatedBody<SubmitQuizAttemptInput>(request));
  response.status(200).json(createSuccessResponse('Quiz attempt submitted successfully', result));
});
export const getMyQuizAttempts: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const query = getValidatedQuery<PaginationInput>(request);
  const result = await listMyQuizAttempts(requireAuth(request).userId, quizId, query.page, query.limit);
  response.status(200).json(createSuccessResponse('Quiz attempts retrieved successfully', result));
});
export const getInstructorQuizAttempts: RequestHandler = asyncHandler(async (request, response) => {
  const { quizId } = getValidatedParams<QuizIdParams>(request);
  const query = getValidatedQuery<PaginationInput>(request);
  const result = await listQuizAttemptsForInstructor(requireAuth(request).userId, quizId, query.page, query.limit);
  response.status(200).json(createSuccessResponse('Quiz attempts retrieved successfully', result));
});
