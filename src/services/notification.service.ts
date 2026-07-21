import type { Types } from 'mongoose';
import type { NotificationType, RelatedEntityType } from '../constants/lms.constants';
import { AppError } from '../errors/AppError';
import { Notification } from '../models/notification.model';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import type { ListNotificationsQuery } from '../validators/notification.validator';

interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string | Types.ObjectId;
}

export const createNotification = async (input: CreateNotificationInput) =>
  Notification.create(input);

export const createNotifications = async (inputs: CreateNotificationInput[]) => {
  if (inputs.length === 0) return;
  await Notification.insertMany(inputs, { ordered: false });
};

export const listMyNotifications = async (userId: string, query: ListNotificationsQuery) => {
  const filter: Record<string, unknown> = { userId };
  if (query.unreadOnly) filter.isRead = false;
  const pagination = getPagination(query);
  const [notifications, totalItems] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Notification.countDocuments(filter),
  ]);
  return {
    notifications,
    pagination: createPaginationMetadata(query.page, query.limit, totalItems),
  };
};

export const getUnreadNotificationCount = async (userId: string) => ({
  unreadCount: await Notification.countDocuments({ userId, isRead: false }),
});

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true },
  );
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  }
  return notification;
};

export const markAllNotificationsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
  return { updatedCount: result.modifiedCount };
};

export const deleteMyNotification = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  }
};
