import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  NOTIFICATION_TYPES,
  RELATED_ENTITY_TYPES,
  type NotificationType,
  type RelatedEntityType,
} from '../constants/lms.constants';

export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument =
  HydratedDocument<INotification>;

const notificationSchema =
  new Schema<INotification>(
    {
      userId: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,

        index:
          true,
      },

      type: {
        type:
          String,

        enum:
          Object.values(
            NOTIFICATION_TYPES,
          ),

        required:
          true,
      },

      title: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          150,
      },

      message: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          1000,
      },

      relatedEntityType: {
        type:
          String,

        enum:
          Object.values(
            RELATED_ENTITY_TYPES,
          ),
      },

      relatedEntityId: {
        type:
          Schema.Types.ObjectId,
      },

      isRead: {
        type:
          Boolean,

        default:
          false,

        required:
          true,
      },

      readAt:
        Date,
    },

    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

notificationSchema.index({
  userId:
    1,

  isRead:
    1,

  createdAt:
    -1,
});

export const Notification =
  model<INotification>(
    'Notification',
    notificationSchema,
  );