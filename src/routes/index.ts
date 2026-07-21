import { Router } from 'express';
import { assignmentRouter, submissionRouter } from './assignment.routes';
import authRouter from './auth.routes';
import categoryRouter from './category.routes';
import courseRouter from './course.routes';
import dashboardRouter from './dashboard.routes';
import enrollmentRouter from './enrollment.routes';
import healthRouter from './health.routes';
import lessonRouter from './lesson.routes';
import notificationRouter from './notification.routes';
import profileRouter from './profile.routes';
import { quizAttemptRouter, quizQuestionRouter, quizRouter } from './quiz.routes';
import reviewRouter from './review.routes';
import sectionRouter from './section.routes';
import userRouter from './user.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/profiles', profileRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/courses', courseRouter);
apiRouter.use('/sections', sectionRouter);
apiRouter.use('/lessons', lessonRouter);
apiRouter.use('/enrollments', enrollmentRouter);
apiRouter.use('/quizzes', quizRouter);
apiRouter.use('/quiz-questions', quizQuestionRouter);
apiRouter.use('/quiz-attempts', quizAttemptRouter);
apiRouter.use('/assignments', assignmentRouter);
apiRouter.use('/submissions', submissionRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/dashboard', dashboardRouter);

export default apiRouter;
