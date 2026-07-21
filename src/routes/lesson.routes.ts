import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import {
  deleteLessonDocument,
  deleteLessonVideo,
  getLessonById,
  patchLesson,
  removeLesson,
  reorderCourseLesson,
  uploadLessonDocument,
  uploadLessonVideo,
} from '../controllers/lesson.controller';
import { completeMyLesson, startMyLesson } from '../controllers/progress.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { uploadDocument, uploadLessonVideo as lessonVideoUpload } from '../middlewares/upload.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { lessonIdParamsSchema, reorderLessonBodySchema, updateLessonBodySchema } from '../validators/lesson.validator';
import { lessonProgressParamsSchema } from '../validators/progress.validator';

const lessonRouter = Router();
lessonRouter.use(authenticate);

lessonRouter.patch('/:lessonId/start', authorize(USER_ROLES.STUDENT), validateRequest({ params: lessonProgressParamsSchema }), startMyLesson);
lessonRouter.patch('/:lessonId/complete', authorize(USER_ROLES.STUDENT), validateRequest({ params: lessonProgressParamsSchema }), completeMyLesson);
lessonRouter.patch('/:lessonId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema, body: updateLessonBodySchema }), patchLesson);
lessonRouter.patch('/:lessonId/reorder', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema, body: reorderLessonBodySchema }), reorderCourseLesson);
lessonRouter.post('/:lessonId/video', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema }), lessonVideoUpload.single('video'), uploadLessonVideo);
lessonRouter.delete('/:lessonId/video', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema }), deleteLessonVideo);
lessonRouter.post('/:lessonId/document', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema }), uploadDocument.single('document'), uploadLessonDocument);
lessonRouter.delete('/:lessonId/document', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema }), deleteLessonDocument);
lessonRouter.delete('/:lessonId', authorize(USER_ROLES.INSTRUCTOR), validateRequest({ params: lessonIdParamsSchema }), removeLesson);
lessonRouter.get('/:lessonId', validateRequest({ params: lessonIdParamsSchema }), getLessonById);

export default lessonRouter;
