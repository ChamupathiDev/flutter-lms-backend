import { Router } from 'express';
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  readAllNotifications,
  readNotification,
  removeNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { listNotificationsQuerySchema, notificationIdParamsSchema } from '../validators/notification.validator';

const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get('/me', validateRequest({ query: listNotificationsQuerySchema }), getMyNotifications);
notificationRouter.get('/me/unread-count', getMyUnreadNotificationCount);
notificationRouter.patch('/me/read-all', readAllNotifications);
notificationRouter.patch('/:notificationId/read', validateRequest({ params: notificationIdParamsSchema }), readNotification);
notificationRouter.delete('/:notificationId', validateRequest({ params: notificationIdParamsSchema }), removeNotification);

export default notificationRouter;
