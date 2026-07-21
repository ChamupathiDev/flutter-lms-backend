import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import {
  createCourseAssignment,
  getInstructorCourseAssignments,
  getStudentCourseAssignments,
} from '../controllers/assignment.controller';
import {
  adminArchiveCourse,
  archiveMyCourse,
  createNewCourse,
  deleteCourseThumbnail,
  getAdminCourses,
  getMyInstructorCourse,
  getMyInstructorCourses,
  getPublishedCourseById,
  getPublishedCourses,
  patchCourse,
  publishMyCourse,
  uploadCourseThumbnail,
} from '../controllers/course.controller';
import { enrollStudentInCourse, getInstructorCourseEnrollments } from '../controllers/enrollment.controller';
import { getCourseProgressForMe } from '../controllers/progress.controller';
import { createCourseQuiz, getInstructorCourseQuizzes, getStudentCourseQuizzes } from '../controllers/quiz.controller';
import { createCourseReview, getCourseReviews } from '../controllers/review.controller';
import { createCourseSection, getCourseSections } from '../controllers/section.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { uploadCourseThumbnail as courseThumbnailUpload } from '../middlewares/upload.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createAssignmentBodySchema } from '../validators/assignment.validator';
import {
  courseIdParamsSchema,
  createCourseBodySchema,
  listAdminCoursesQuerySchema,
  listCoursesQuerySchema,
  listInstructorCoursesQuerySchema,
  updateCourseBodySchema,
} from '../validators/course.validator';
import { listEnrollmentsQuerySchema } from '../validators/enrollment.validator';
import { createQuizBodySchema } from '../validators/quiz.validator';
import { createReviewBodySchema, listReviewsQuerySchema } from '../validators/review.validator';
import { createSectionBodySchema } from '../validators/section.validator';

const courseRouter = Router();

courseRouter.get('/', validateRequest({ query: listCoursesQuerySchema }), getPublishedCourses);
courseRouter.get('/admin/all', authenticate, authorize(USER_ROLES.ADMIN), validateRequest({ query: listAdminCoursesQuerySchema }), getAdminCourses);
courseRouter.get('/instructor/me', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ query: listInstructorCoursesQuerySchema }), getMyInstructorCourses);
courseRouter.get('/instructor/me/:courseId', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), getMyInstructorCourse);
courseRouter.post('/', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ body: createCourseBodySchema }), createNewCourse);
courseRouter.patch('/:courseId', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema, body: updateCourseBodySchema }), patchCourse);
courseRouter.post('/:courseId/thumbnail', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), courseThumbnailUpload.single('thumbnail'), uploadCourseThumbnail);
courseRouter.delete('/:courseId/thumbnail', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), deleteCourseThumbnail);
courseRouter.patch('/:courseId/publish', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), publishMyCourse);
courseRouter.patch('/:courseId/archive', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), archiveMyCourse);
courseRouter.patch('/:courseId/admin/archive', authenticate, authorize(USER_ROLES.ADMIN), validateRequest({ params: courseIdParamsSchema }), adminArchiveCourse);

courseRouter.post('/:courseId/sections', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema, body: createSectionBodySchema }), createCourseSection);
courseRouter.get('/:courseId/sections', authenticate, validateRequest({ params: courseIdParamsSchema }), getCourseSections);

courseRouter.post('/:courseId/enroll', authenticate, authorize(USER_ROLES.STUDENT), validateRequest({ params: courseIdParamsSchema }), enrollStudentInCourse);
courseRouter.get('/:courseId/enrollments', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema, query: listEnrollmentsQuerySchema }), getInstructorCourseEnrollments);
courseRouter.get('/:courseId/progress/me', authenticate, authorize(USER_ROLES.STUDENT), validateRequest({ params: courseIdParamsSchema }), getCourseProgressForMe);

courseRouter.post('/:courseId/quizzes', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema, body: createQuizBodySchema }), createCourseQuiz);
courseRouter.get('/:courseId/quizzes/instructor', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), getInstructorCourseQuizzes);
courseRouter.get('/:courseId/quizzes', authenticate, authorize(USER_ROLES.STUDENT), validateRequest({ params: courseIdParamsSchema }), getStudentCourseQuizzes);

courseRouter.post('/:courseId/assignments', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema, body: createAssignmentBodySchema }), createCourseAssignment);
courseRouter.get('/:courseId/assignments/instructor', authenticate, authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: courseIdParamsSchema }), getInstructorCourseAssignments);
courseRouter.get('/:courseId/assignments', authenticate, authorize(USER_ROLES.STUDENT), validateRequest({ params: courseIdParamsSchema }), getStudentCourseAssignments);

courseRouter.post('/:courseId/reviews', authenticate, authorize(USER_ROLES.STUDENT), validateRequest({ params: courseIdParamsSchema, body: createReviewBodySchema }), createCourseReview);
courseRouter.get('/:courseId/reviews', validateRequest({ params: courseIdParamsSchema, query: listReviewsQuerySchema }), getCourseReviews);

courseRouter.get('/:courseId', validateRequest({ params: courseIdParamsSchema }), getPublishedCourseById);

export default courseRouter;
