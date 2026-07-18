import {
  Router,
} from 'express';

import authRouter from './auth.routes';
import healthRouter from './health.routes';
import profileRouter from './profile.routes';
import userRouter from './user.routes';

const apiRouter =
  Router();

apiRouter.use(
  '/health',
  healthRouter,
);

apiRouter.use(
  '/auth',
  authRouter,
);

apiRouter.use(
  '/users',
  userRouter,
);

apiRouter.use(
  '/profiles',
  profileRouter,
);

export default apiRouter;