import type { AuthenticatedUser } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;

      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};