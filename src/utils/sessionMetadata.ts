import type {
  Request,
} from 'express';

import type {
  SessionMetadata,
} from '../types/auth.types.ts';

export const getSessionMetadata = (
  request: Request,
): SessionMetadata => ({
  ipAddress:
    request.ip,

  userAgent:
    request
      .get('user-agent')
      ?.slice(0, 500),
});