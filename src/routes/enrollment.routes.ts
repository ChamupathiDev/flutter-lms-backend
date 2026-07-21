import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import { cancelEnrollment, getAdminEnrollments, getMyEnrollmentById, getMyEnrollments } from '../controllers/enrollment.controller';
import { getEnrollmentProgressForMe } from '../controllers/progress.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { enrollmentIdParamsSchema, listAdminEnrollmentsQuerySchema, listEnrollmentsQuerySchema } from '../validators/enrollment.validator';
import { enrollmentProgressParamsSchema } from '../validators/progress.validator';

const enrollmentRouter = Router();
enrollmentRouter.use(authenticate);

enrollmentRouter.get('/admin/all', authorize(USER_ROLES.ADMIN), validateRequest({ query: listAdminEnrollmentsQuerySchema }), getAdminEnrollments);
enrollmentRouter.get('/me', authorize(USER_ROLES.STUDENT), validateRequest({ query: listEnrollmentsQuerySchema }), getMyEnrollments);
enrollmentRouter.get('/:enrollmentId/progress', authorize(USER_ROLES.STUDENT), validateRequest({ params: enrollmentProgressParamsSchema }), getEnrollmentProgressForMe);
enrollmentRouter.get('/:enrollmentId', authorize(USER_ROLES.STUDENT), validateRequest({ params: enrollmentIdParamsSchema }), getMyEnrollmentById);
enrollmentRouter.patch('/:enrollmentId/cancel', authorize(USER_ROLES.STUDENT), validateRequest({ params: enrollmentIdParamsSchema }), cancelEnrollment);

export default enrollmentRouter;
