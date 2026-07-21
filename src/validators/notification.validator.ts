import { z } from 'zod';

import {
  booleanQuerySchema,
  mongoIdSchema,
  paginationQuerySchema,
} from './common.validator';

export const notificationIdParamsSchema =
  z
    .object({
      notificationId:
        mongoIdSchema,
    })
    .strict();

export const listNotificationsQuerySchema =
  paginationQuerySchema
    .extend({
      unreadOnly:
        booleanQuerySchema
          .default(false),
    })
    .strict();

export type NotificationIdParams =
  z.infer<
    typeof notificationIdParamsSchema
  >;

export type ListNotificationsQuery =
  z.infer<
    typeof listNotificationsQuerySchema
  >;