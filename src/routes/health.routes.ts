import { Router } from 'express';
import {
  getHealth,
  getLiveness,
  getReadiness,
} from '../controllers/health.controller';

const healthRouter = Router();

healthRouter.get('/', getHealth);

healthRouter.get('/live', getLiveness);

healthRouter.get('/ready', getReadiness);

export default healthRouter;