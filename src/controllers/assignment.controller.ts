import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import {
  createAssignment,
  deleteAssignment,
  getMySubmission,
  getStudentAssignment,
  gradeSubmission,
  listAssignmentSubmissions,
  listInstructorAssignments,
  listStudentAssignments,
  publishAssignment,
  removeAssignmentAttachment,
  replaceAssignmentAttachment,
  replaceSubmissionFile,
  submitAssignment,
  updateAssignment,
  updateMySubmission,
} from '../services/assignment.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedBody, getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type {
  AssignmentIdParams,
  CourseAssignmentParams,
  CreateAssignmentInput,
  GradeSubmissionInput,
  ListSubmissionsQuery,
  SubmissionIdParams,
  SubmitAssignmentInput,
  UpdateAssignmentInput,
  UpdateSubmissionInput,
} from '../validators/assignment.validator';

export const createCourseAssignment: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseAssignmentParams>(request);
  const assignment = await createAssignment(requireAuth(request).userId, courseId, getValidatedBody<CreateAssignmentInput>(request));
  response.status(201).json(createSuccessResponse('Assignment created successfully', { assignment }));
});
export const getInstructorCourseAssignments: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseAssignmentParams>(request);
  const assignments = await listInstructorAssignments(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Instructor assignments retrieved successfully', { assignments }));
});
export const patchAssignment: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const assignment = await updateAssignment(requireAuth(request).userId, assignmentId, getValidatedBody<UpdateAssignmentInput>(request));
  response.status(200).json(createSuccessResponse('Assignment updated successfully', { assignment }));
});
export const uploadAssignmentAttachment: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.file) throw new AppError('An assignment attachment file is required', 422, 'ASSIGNMENT_ATTACHMENT_REQUIRED');
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const assignment = await replaceAssignmentAttachment(requireAuth(request).userId, assignmentId, request.file);
  response.status(200).json(createSuccessResponse('Assignment attachment uploaded successfully', { assignment }));
});
export const deleteAssignmentAttachment: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const assignment = await removeAssignmentAttachment(requireAuth(request).userId, assignmentId);
  response.status(200).json(createSuccessResponse('Assignment attachment removed successfully', { assignment }));
});
export const publishCourseAssignment: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const assignment = await publishAssignment(requireAuth(request).userId, assignmentId);
  response.status(200).json(createSuccessResponse('Assignment published successfully', { assignment }));
});
export const removeAssignment: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  await deleteAssignment(requireAuth(request).userId, assignmentId);
  response.status(200).json(createSuccessResponse('Assignment deleted successfully', null));
});
export const getStudentCourseAssignments: RequestHandler = asyncHandler(async (request, response) => {
  const { courseId } = getValidatedParams<CourseAssignmentParams>(request);
  const assignments = await listStudentAssignments(requireAuth(request).userId, courseId);
  response.status(200).json(createSuccessResponse('Course assignments retrieved successfully', { assignments }));
});
export const getStudentAssignmentById: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const assignment = await getStudentAssignment(requireAuth(request).userId, assignmentId);
  response.status(200).json(createSuccessResponse('Assignment retrieved successfully', { assignment }));
});
export const submitStudentAssignment: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const submission = await submitAssignment(
    requireAuth(request).userId,
    assignmentId,
    getValidatedBody<SubmitAssignmentInput>(request),
    request.file,
  );
  response.status(201).json(createSuccessResponse('Assignment submitted successfully', { submission }));
});
export const getMyAssignmentSubmission: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const submission = await getMySubmission(requireAuth(request).userId, assignmentId);
  response.status(200).json(createSuccessResponse('Assignment submission retrieved successfully', { submission }));
});
export const patchMyAssignmentSubmission: RequestHandler = asyncHandler(async (request, response) => {
  const { submissionId } = getValidatedParams<SubmissionIdParams>(request);
  const submission = await updateMySubmission(requireAuth(request).userId, submissionId, getValidatedBody<UpdateSubmissionInput>(request));
  response.status(200).json(createSuccessResponse('Assignment submission updated successfully', { submission }));
});
export const uploadSubmissionFile: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.file) throw new AppError('A submission file is required', 422, 'SUBMISSION_FILE_REQUIRED');
  const { submissionId } = getValidatedParams<SubmissionIdParams>(request);
  const submission = await replaceSubmissionFile(requireAuth(request).userId, submissionId, request.file);
  response.status(200).json(createSuccessResponse('Submission file uploaded successfully', { submission }));
});
export const getAssignmentSubmissions: RequestHandler = asyncHandler(async (request, response) => {
  const { assignmentId } = getValidatedParams<AssignmentIdParams>(request);
  const result = await listAssignmentSubmissions(requireAuth(request).userId, assignmentId, getValidatedQuery<ListSubmissionsQuery>(request));
  response.status(200).json(createSuccessResponse('Assignment submissions retrieved successfully', result));
});
export const gradeAssignmentSubmission: RequestHandler = asyncHandler(async (request, response) => {
  const { submissionId } = getValidatedParams<SubmissionIdParams>(request);
  const submission = await gradeSubmission(requireAuth(request).userId, submissionId, getValidatedBody<GradeSubmissionInput>(request));
  response.status(200).json(createSuccessResponse('Assignment submission graded successfully', { submission }));
});
