import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import {
  createCourseCategory,
  getCourseCategories,
  getCourseCategory,
  patchCourseCategory,
  patchCourseCategoryStatus,
} from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  categoryIdParamsSchema,
  createCategoryBodySchema,
  listCategoriesQuerySchema,
  updateCategoryBodySchema,
  updateCategoryStatusBodySchema,
} from '../validators/category.validator';

const categoryRouter = Router();

categoryRouter.get('/', validateRequest({ query: listCategoriesQuerySchema }), getCourseCategories);
categoryRouter.get('/:categoryId', validateRequest({ params: categoryIdParamsSchema }), getCourseCategory);
categoryRouter.post('/', authenticate, authorize(USER_ROLES.ADMIN), validateRequest({ body: createCategoryBodySchema }), createCourseCategory);
categoryRouter.patch('/:categoryId', authenticate, authorize(USER_ROLES.ADMIN), validateRequest({ params: categoryIdParamsSchema, body: updateCategoryBodySchema }), patchCourseCategory);
categoryRouter.patch('/:categoryId/status', authenticate, authorize(USER_ROLES.ADMIN), validateRequest({ params: categoryIdParamsSchema, body: updateCategoryStatusBodySchema }), patchCourseCategoryStatus);

export default categoryRouter;
