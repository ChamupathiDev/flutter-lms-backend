import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import {
  deleteAssignmentAttachment,
  getAssignmentSubmissions,
  getMyAssignmentSubmission,
  getStudentAssignmentById,
  gradeAssignmentSubmission,
  patchAssignment,
  patchMyAssignmentSubmission,
  publishCourseAssignment,
  removeAssignment,
  submitStudentAssignment,
  uploadAssignmentAttachment,
  uploadSubmissionFile,
} from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { uploadAssignmentSubmission, uploadDocument } from '../middlewares/upload.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  assignmentIdParamsSchema,
  gradeSubmissionBodySchema,
  listSubmissionsQuerySchema,
  submissionIdParamsSchema,
  submitAssignmentBodySchema,
  updateAssignmentBodySchema,
  updateSubmissionBodySchema,
} from '../validators/assignment.validator';

export const assignmentRouter = Router();
assignmentRouter.use(authenticate);

assignmentRouter.get('/:assignmentId/submissions', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: assignmentIdParamsSchema, query: listSubmissionsQuerySchema }), getAssignmentSubmissions);
assignmentRouter.get('/:assignmentId/submission/me', authorize(USER_ROLES.STUDENT), validateRequest({ params: assignmentIdParamsSchema }), getMyAssignmentSubmission);
assignmentRouter.post('/:assignmentId/submissions', authorize(USER_ROLES.STUDENT), validateRequest({ params: assignmentIdParamsSchema }), uploadAssignmentSubmission.single('file'), validateRequest({ body: submitAssignmentBodySchema }), submitStudentAssignment);
assignmentRouter.post('/:assignmentId/attachment', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: assignmentIdParamsSchema }), uploadDocument.single('attachment'), uploadAssignmentAttachment);
assignmentRouter.delete('/:assignmentId/attachment', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: assignmentIdParamsSchema }), deleteAssignmentAttachment);
assignmentRouter.patch('/:assignmentId/publish', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: assignmentIdParamsSchema }), publishCourseAssignment);
assignmentRouter.patch('/:assignmentId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: assignmentIdParamsSchema, body: updateAssignmentBodySchema }), patchAssignment);
assignmentRouter.delete('/:assignmentId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: assignmentIdParamsSchema }), removeAssignment);
assignmentRouter.get('/:assignmentId', authorize(USER_ROLES.STUDENT), validateRequest({ params: assignmentIdParamsSchema }), getStudentAssignmentById);

export const submissionRouter = Router();
submissionRouter.use(authenticate);
submissionRouter.patch('/:submissionId', authorize(USER_ROLES.STUDENT), validateRequest({ params: submissionIdParamsSchema, body: updateSubmissionBodySchema }), patchMyAssignmentSubmission);
submissionRouter.post('/:submissionId/file', authorize(USER_ROLES.STUDENT), validateRequest({ params: submissionIdParamsSchema }), uploadAssignmentSubmission.single('file'), uploadSubmissionFile);
submissionRouter.patch('/:submissionId/grade', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: submissionIdParamsSchema, body: gradeSubmissionBodySchema }), gradeAssignmentSubmission);
