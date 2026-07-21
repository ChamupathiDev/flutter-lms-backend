import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import {
  getAdminDashboardSummary,
  getInstructorDashboardSummary,
  getStudentDashboardSummary,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/student', authorize(USER_ROLES.STUDENT), getStudentDashboardSummary);
dashboardRouter.get('/instructor', authorize(USER_ROLES.INSTRUCTOR), getInstructorDashboardSummary);
dashboardRouter.get('/admin', authorize(USER_ROLES.ADMIN), getAdminDashboardSummary);

export default dashboardRouter;
