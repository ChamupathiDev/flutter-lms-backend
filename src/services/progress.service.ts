import { ENROLLMENT_STATUSES, LESSON_PROGRESS_STATUSES, NOTIFICATION_TYPES, RELATED_ENTITY_TYPES } from '../constants/lms.constants';
import { AppError } from '../errors/AppError';
import { Course } from '../models/course.model';
import { CourseSection } from '../models/courseSection.model';
import { Enrollment } from '../models/enrollment.model';
import { Lesson } from '../models/lesson.model';
import { LessonProgress } from '../models/lessonProgress.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import { getEnrollmentOrThrow } from './lmsAccess.service';
import { createNotification } from './notification.service';

const getPublishedLessonIds = async (courseId: string) => {
  const publishedSectionIds = await CourseSection.find({ courseId, isPublished: true }).distinct('_id');
  if (publishedSectionIds.length === 0) return [];
  return Lesson.find({
    courseId,
    sectionId: { $in: publishedSectionIds },
    isPublished: true,
  }).distinct('_id');
};

export const recalculateEnrollmentProgress = async (enrollmentId: string) => {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');

  const publishedLessonIds = await getPublishedLessonIds(enrollment.courseId.toString());
  const totalLessons = publishedLessonIds.length;
  const completedLessons = totalLessons === 0
    ? 0
    : await LessonProgress.countDocuments({
        enrollmentId,
        lessonId: { $in: publishedLessonIds },
        status: LESSON_PROGRESS_STATUSES.COMPLETED,
      });
  const percentage = totalLessons === 0 ? 0 : Math.min(100, Math.round((completedLessons / totalLessons) * 100));
  const wasCompleted = enrollment.status === ENROLLMENT_STATUSES.COMPLETED;
  enrollment.progressPercentage = percentage;
  if (percentage === 100 && totalLessons > 0) {
    enrollment.status = ENROLLMENT_STATUSES.COMPLETED;
    enrollment.completedAt ??= new Date();
  } else if (enrollment.status !== ENROLLMENT_STATUSES.CANCELLED) {
    enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
    enrollment.completedAt = undefined;
  }
  await enrollment.save();

  if (!wasCompleted && enrollment.status === ENROLLMENT_STATUSES.COMPLETED) {
    const course = await Course.findById(enrollment.courseId).select('title').lean();
    await createNotification({
      userId: enrollment.studentId,
      type: NOTIFICATION_TYPES.COURSE_COMPLETED,
      title: 'Course completed',
      message: `You completed ${course?.title ?? 'your course'}.`,
      relatedEntityType: RELATED_ENTITY_TYPES.COURSE,
      relatedEntityId: enrollment.courseId,
    });
  }

  return { enrollment, totalLessons, completedLessons, publishedLessonIds };
};

export const recalculateCourseEnrollments = async (courseId: string) => {
  const enrollmentIds = await Enrollment.find({
    courseId,
    status: { $ne: ENROLLMENT_STATUSES.CANCELLED },
  }).distinct('_id');
  for (const enrollmentId of enrollmentIds) {
    await recalculateEnrollmentProgress(enrollmentId.toString());
  }
};

const getAccessibleLessonAndEnrollment = async (studentId: string, lessonId: string) => {
  const lesson = await Lesson.findOne({ _id: lessonId, isPublished: true });
  if (!lesson) throw new AppError('Published lesson not found', 404, 'LESSON_NOT_FOUND');
  if (!await CourseSection.exists({ _id: lesson.sectionId, isPublished: true })) {
    throw new AppError('This lesson section is not published', 403, 'SECTION_NOT_PUBLISHED');
  }
  const enrollment = await getEnrollmentOrThrow(studentId, lesson.courseId.toString());
  return { lesson, enrollment };
};

export const startLesson = async (studentId: string, lessonId: string) => {
  const { lesson, enrollment } = await getAccessibleLessonAndEnrollment(studentId, lessonId);
  const now = new Date();
  const existing = await LessonProgress.findOne({ studentId, lessonId });
  const progress = existing ?? new LessonProgress({
    studentId,
    lessonId,
    courseId: lesson.courseId,
    enrollmentId: enrollment._id,
  });
  if (progress.status !== LESSON_PROGRESS_STATUSES.COMPLETED) {
    progress.status = LESSON_PROGRESS_STATUSES.IN_PROGRESS;
    progress.startedAt ??= now;
  }
  progress.lastAccessedAt = now;
  await progress.save();
  enrollment.lastAccessedAt = now;
  await enrollment.save();
  return normalizeMongo(progress);
};

export const completeLesson = async (studentId: string, lessonId: string) => {
  const { lesson, enrollment } = await getAccessibleLessonAndEnrollment(studentId, lessonId);
  const now = new Date();
  const progress = await LessonProgress.findOne({ studentId, lessonId }) ?? new LessonProgress({
    studentId,
    lessonId,
    courseId: lesson.courseId,
    enrollmentId: enrollment._id,
  });
  progress.status = LESSON_PROGRESS_STATUSES.COMPLETED;
  progress.startedAt ??= now;
  progress.completedAt = now;
  progress.lastAccessedAt = now;
  await progress.save();
  enrollment.lastAccessedAt = now;
  await enrollment.save();
  const summary = await recalculateEnrollmentProgress(enrollment.id);
  return {
    lessonProgress: normalizeMongo(progress),
    courseProgress: {
      progressPercentage: summary.enrollment.progressPercentage,
      enrollmentStatus: summary.enrollment.status,
      totalLessons: summary.totalLessons,
      completedLessons: summary.completedLessons,
    },
  };
};

export const getMyCourseProgress = async (studentId: string, courseId: string) => {
  const enrollment = await getEnrollmentOrThrow(studentId, courseId);
  const publishedSectionIds = await CourseSection.find({ courseId, isPublished: true }).distinct('_id');
  const lessons = await Lesson.find({
    courseId,
    sectionId: { $in: publishedSectionIds },
    isPublished: true,
  })
    .populate('sectionId', 'title order')
    .sort({ sectionId: 1, order: 1 })
    .lean();
  const progressRecords = await LessonProgress.find({ studentId, courseId }).lean();
  const progressMap = new Map(progressRecords.map((item) => [item.lessonId.toString(), item]));
  return {
    enrollment: normalizeMongo(enrollment),
    lessons: normalizeMongo(lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson._id.toString()) ?? {
        status: LESSON_PROGRESS_STATUSES.NOT_STARTED,
        startedAt: null,
        completedAt: null,
      },
    }))),
  };
};

export const getEnrollmentProgress = async (studentId: string, enrollmentId: string) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, studentId });
  if (!enrollment) throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
  return getMyCourseProgress(studentId, enrollment.courseId.toString());
};
