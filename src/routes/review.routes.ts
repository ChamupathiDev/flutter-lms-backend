import { Router } from 'express';
import { USER_ROLES } from '../constants/user.constants';
import { patchMyCourseReview, patchReviewVisibility, removeMyCourseReview } from '../controllers/review.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { reviewIdParamsSchema, updateReviewBodySchema, updateReviewVisibilityBodySchema } from '../validators/review.validator';

const reviewRouter = Router();
reviewRouter.use(authenticate);
reviewRouter.patch('/:reviewId', authorize(USER_ROLES.STUDENT), validateRequest({ params: reviewIdParamsSchema, body: updateReviewBodySchema }), patchMyCourseReview);
reviewRouter.delete('/:reviewId', authorize(USER_ROLES.STUDENT), validateRequest({ params: reviewIdParamsSchema }), removeMyCourseReview);
reviewRouter.patch('/:reviewId/visibility', authorize(USER_ROLES.ADMIN), validateRequest({ params: reviewIdParamsSchema, body: updateReviewVisibilityBodySchema }), patchReviewVisibility);

export default reviewRouter;
