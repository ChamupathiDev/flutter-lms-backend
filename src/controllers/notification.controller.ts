import type { RequestHandler } from 'express';
import {
  deleteMyNotification,
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getValidatedParams, getValidatedQuery, requireAuth } from '../utils/request';
import type { ListNotificationsQuery, NotificationIdParams } from '../validators/notification.validator';

export const getMyNotifications: RequestHandler = asyncHandler(async (request, response) => {
  const result = await listMyNotifications(requireAuth(request).userId, getValidatedQuery<ListNotificationsQuery>(request));
  response.status(200).json(createSuccessResponse('Notifications retrieved successfully', result));
});
export const getMyUnreadNotificationCount: RequestHandler = asyncHandler(async (request, response) => {
  const result = await getUnreadNotificationCount(requireAuth(request).userId);
  response.status(200).json(createSuccessResponse('Unread notification count retrieved successfully', result));
});
export const readNotification: RequestHandler = asyncHandler(async (request, response) => {
  const { notificationId } = getValidatedParams<NotificationIdParams>(request);
  const notification = await markNotificationRead(requireAuth(request).userId, notificationId);
  response.status(200).json(createSuccessResponse('Notification marked as read successfully', { notification }));
});
export const readAllNotifications: RequestHandler = asyncHandler(async (request, response) => {
  const result = await markAllNotificationsRead(requireAuth(request).userId);
  response.status(200).json(createSuccessResponse('All notifications marked as read successfully', result));
});
export const removeNotification: RequestHandler = asyncHandler(async (request, response) => {
  const { notificationId } = getValidatedParams<NotificationIdParams>(request);
  await deleteMyNotification(requireAuth(request).userId, notificationId);
  response.status(200).json(createSuccessResponse('Notification deleted successfully', null));
});
