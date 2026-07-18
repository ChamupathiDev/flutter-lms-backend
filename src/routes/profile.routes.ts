import {
  Router,
} from 'express';

import {
  createMyInstructorProfile,
  createMyStudentProfile,
  deleteMyInstructorProfile,
  deleteMyStudentProfile,
  getMyInstructorProfile,
  getMyStudentProfile,
  updateMyInstructorProfile,
  updateMyStudentProfile,
} from '../controllers/profile.controller';

import {
  authenticate,
} from '../middlewares/authenticate.middleware';

import {
  validateRequest,
} from '../middlewares/validate.middleware';

import {
  createInstructorProfileBodySchema,
  createStudentProfileBodySchema,
  updateInstructorProfileBodySchema,
  updateStudentProfileBodySchema,
} from '../validators/profile.validator';

const profileRouter =
  Router();

profileRouter.use(
  authenticate,
);

profileRouter.post(
  '/student/me',

  validateRequest({
    body:
      createStudentProfileBodySchema,
  }),

  createMyStudentProfile,
);

profileRouter.get(
  '/student/me',
  getMyStudentProfile,
);

profileRouter.patch(
  '/student/me',

  validateRequest({
    body:
      updateStudentProfileBodySchema,
  }),

  updateMyStudentProfile,
);

profileRouter.delete(
  '/student/me',
  deleteMyStudentProfile,
);

profileRouter.post(
  '/instructor/me',

  validateRequest({
    body:
      createInstructorProfileBodySchema,
  }),

  createMyInstructorProfile,
);

profileRouter.get(
  '/instructor/me',
  getMyInstructorProfile,
);

profileRouter.patch(
  '/instructor/me',

  validateRequest({
    body:
      updateInstructorProfileBodySchema,
  }),

  updateMyInstructorProfile,
);

profileRouter.delete(
  '/instructor/me',
  deleteMyInstructorProfile,
);

export default profileRouter;