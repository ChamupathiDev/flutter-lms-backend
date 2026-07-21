import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import { createSectionLesson, getSectionLessons } from '../controllers/lesson.controller';
import { patchCourseSection, removeCourseSection, reorderCourseSection } from '../controllers/section.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createLessonBodySchema, sectionLessonParamsSchema } from '../validators/lesson.validator';
import { reorderSectionBodySchema, sectionIdParamsSchema, updateSectionBodySchema } from '../validators/section.validator';

const sectionRouter = Router();
sectionRouter.use(authenticate);

sectionRouter.post('/:sectionId/lessons', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: sectionLessonParamsSchema, body: createLessonBodySchema }), createSectionLesson);
sectionRouter.get('/:sectionId/lessons', validateRequest({ params: sectionLessonParamsSchema }), getSectionLessons);
sectionRouter.patch('/:sectionId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: sectionIdParamsSchema, body: updateSectionBodySchema }), patchCourseSection);
sectionRouter.patch('/:sectionId/reorder', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: sectionIdParamsSchema, body: reorderSectionBodySchema }), reorderCourseSection);
sectionRouter.delete('/:sectionId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: sectionIdParamsSchema }), removeCourseSection);

export default sectionRouter;
