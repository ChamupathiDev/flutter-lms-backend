import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import {
  addQuizQuestion,
  getInstructorQuizAttempts,
  getInstructorQuizById,
  getMyQuizAttempts,
  getStudentQuizById,
  patchQuiz,
  patchQuizQuestion,
  publishCourseQuiz,
  removeQuiz,
  removeQuizQuestion,
  startStudentQuizAttempt,
  submitStudentQuizAttempt,
} from '../controllers/quiz.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createQuizQuestionBodySchema,
  listQuizAttemptsQuerySchema,
  quizAttemptIdParamsSchema,
  quizIdParamsSchema,
  quizQuestionIdParamsSchema,
  submitQuizAttemptBodySchema,
  updateQuizBodySchema,
  updateQuizQuestionBodySchema,
} from '../validators/quiz.validator';

export const quizRouter = Router();
quizRouter.use(authenticate);

quizRouter.get('/:quizId/instructor', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: quizIdParamsSchema }), getInstructorQuizById);
quizRouter.get('/:quizId/attempts/instructor', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: quizIdParamsSchema, query: listQuizAttemptsQuerySchema }), getInstructorQuizAttempts);
quizRouter.get('/:quizId/attempts/me', authorize(USER_ROLES.STUDENT), validateRequest({ params: quizIdParamsSchema, query: listQuizAttemptsQuerySchema }), getMyQuizAttempts);
quizRouter.post('/:quizId/questions', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: quizIdParamsSchema, body: createQuizQuestionBodySchema }), addQuizQuestion);
quizRouter.patch('/:quizId/publish', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: quizIdParamsSchema }), publishCourseQuiz);
quizRouter.patch('/:quizId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: quizIdParamsSchema, body: updateQuizBodySchema }), patchQuiz);
quizRouter.delete('/:quizId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: quizIdParamsSchema }), removeQuiz);
quizRouter.post('/:quizId/start', authorize(USER_ROLES.STUDENT), validateRequest({ params: quizIdParamsSchema }), startStudentQuizAttempt);
quizRouter.get('/:quizId', authorize(USER_ROLES.STUDENT), validateRequest({ params: quizIdParamsSchema }), getStudentQuizById);

export const quizQuestionRouter = Router();
quizQuestionRouter.use(authenticate, authorize(USER_ROLES.INSTRUCTOR));
quizQuestionRouter.patch('/:questionId', validateRequest({ params: quizQuestionIdParamsSchema, body: updateQuizQuestionBodySchema }), patchQuizQuestion);
quizQuestionRouter.delete('/:questionId', validateRequest({ params: quizQuestionIdParamsSchema }), removeQuizQuestion);

export const quizAttemptRouter = Router();
quizAttemptRouter.use(authenticate, authorize(USER_ROLES.STUDENT));
quizAttemptRouter.post('/:attemptId/submit', validateRequest({ params: quizAttemptIdParamsSchema, body: submitQuizAttemptBodySchema }), submitStudentQuizAttempt);
