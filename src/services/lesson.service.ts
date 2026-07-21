import { COURSE_STATUSES, LESSON_TYPES } from '../constants/lms.constants';
import { USER_ROLES, type UserRole } from '../constants/user.constants';
import { AppError } from '../errors/AppError';
import { Course } from '../models/course.model';
import { CourseSection } from '../models/courseSection.model';
import { Lesson } from '../models/lesson.model';
import { LessonProgress } from '../models/lessonProgress.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import type { CreateLessonInput, ReorderLessonInput, UpdateLessonInput } from '../validators/lesson.validator';
import { deleteStoredAsset, uploadAssetBuffer } from './fileUpload.service';
import { assertCourseContentAccess, getOwnedCourseOrThrow } from './lmsAccess.service';
import { recalculateCourseEnrollments } from './progress.service';

const getOwnedSection = async (instructorId: string, sectionId: string) => {
  const section = await CourseSection.findById(sectionId);
  if (!section) throw new AppError('Course section not found', 404, 'SECTION_NOT_FOUND');
  const course = await getOwnedCourseOrThrow(section.courseId.toString(), instructorId);
  if (course.status === COURSE_STATUSES.ARCHIVED) {
    throw new AppError('An archived course cannot be changed', 409, 'COURSE_ARCHIVED');
  }
  return { section, course };
};

const getOwnedLesson = async (instructorId: string, lessonId: string, includeAssets = false) => {
  const query = Lesson.findById(lessonId);
  if (includeAssets) query.select('+videoPublicId +documentPublicId');
  const lesson = await query;
  if (!lesson) throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');
  await getOwnedCourseOrThrow(lesson.courseId.toString(), instructorId);
  return lesson;
};

const assertLessonCanPublish = (lesson: { lessonType: string; textContent?: string | null; videoUrl?: string; documentUrl?: string }) => {
  if (lesson.lessonType === LESSON_TYPES.TEXT && !lesson.textContent) {
    throw new AppError('Text content is required before publishing this lesson', 409, 'LESSON_CONTENT_REQUIRED');
  }
  if (lesson.lessonType === LESSON_TYPES.VIDEO && !lesson.videoUrl) {
    throw new AppError('A video is required before publishing this lesson', 409, 'LESSON_VIDEO_REQUIRED');
  }
  if (lesson.lessonType === LESSON_TYPES.DOCUMENT && !lesson.documentUrl) {
    throw new AppError('A document is required before publishing this lesson', 409, 'LESSON_DOCUMENT_REQUIRED');
  }
};

export const createLesson = async (instructorId: string, sectionId: string, input: CreateLessonInput) => {
  const { section } = await getOwnedSection(instructorId, sectionId);
  const lastLesson = await Lesson.findOne({ sectionId }).sort({ order: -1 }).select('order').lean();
  const lesson = new Lesson({
    courseId: section.courseId,
    sectionId,
    ...input,
    order: (lastLesson?.order ?? 0) + 1,
  });
  if (lesson.isPublished) assertLessonCanPublish(lesson);
  await lesson.save();
  if (lesson.isPublished) await recalculateCourseEnrollments(section.courseId.toString());
  return normalizeMongo(lesson);
};

export const listSectionLessons = async (userId: string, role: UserRole, sectionId: string) => {
  const section = await CourseSection.findById(sectionId);
  if (!section) throw new AppError('Course section not found', 404, 'SECTION_NOT_FOUND');
  await assertCourseContentAccess(userId, role, section.courseId.toString());
  if (role === USER_ROLES.STUDENT && !section.isPublished) {
    throw new AppError('This course section is not published', 403, 'SECTION_NOT_PUBLISHED');
  }
  const filter: Record<string, unknown> = { sectionId };
  if (role === USER_ROLES.STUDENT) filter.isPublished = true;
  const lessons = await Lesson.find(filter).sort({ order: 1 }).lean();
  return normalizeMongo(lessons);
};

export const getLesson = async (userId: string, role: UserRole, lessonId: string) => {
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) throw new AppError('Lesson not found', 404, 'LESSON_NOT_FOUND');

  if (role === USER_ROLES.ADMIN) return normalizeMongo(lesson);
  if (role === USER_ROLES.INSTRUCTOR) {
    await getOwnedCourseOrThrow(lesson.courseId.toString(), userId);
    return normalizeMongo(lesson);
  }

  const courseAccess = await assertCourseContentAccess(userId, role, lesson.courseId.toString()).catch(async (error: unknown) => {
    if (lesson.isPreview) {
      const course = await Course.findById(lesson.courseId);
      if (course?.status === COURSE_STATUSES.PUBLISHED && lesson.isPublished) return { course, enrollment: null };
    }
    throw error;
  });
  void courseAccess;
  if (!lesson.isPublished) throw new AppError('This lesson is not published', 403, 'LESSON_NOT_PUBLISHED');
  return normalizeMongo(lesson);
};

export const updateLesson = async (instructorId: string, lessonId: string, input: UpdateLessonInput) => {
  const lesson = await getOwnedLesson(instructorId, lessonId, true);
  const oldVideoPublicId = lesson.videoPublicId;
  const oldDocumentPublicId = lesson.documentPublicId;
  const wasPublished = lesson.isPublished;

  if (input.title !== undefined) lesson.title = input.title;
  if (input.description !== undefined) lesson.description = input.description;
  if (input.lessonType !== undefined) lesson.lessonType = input.lessonType;
  if (input.textContent !== undefined) lesson.textContent = input.textContent;
  if (input.durationMinutes !== undefined) lesson.durationMinutes = input.durationMinutes;
  if (input.isPreview !== undefined) lesson.isPreview = input.isPreview;
  if (input.isPublished !== undefined) lesson.isPublished = input.isPublished;

  let deleteVideo = false;
  let deleteDocument = false;
  if (input.lessonType === LESSON_TYPES.TEXT) {
    lesson.videoUrl = undefined;
    lesson.videoPublicId = undefined;
    lesson.documentUrl = undefined;
    lesson.documentPublicId = undefined;
    lesson.documentName = undefined;
    deleteVideo = true;
    deleteDocument = true;
  } else if (input.lessonType === LESSON_TYPES.VIDEO) {
    lesson.textContent = undefined;
    lesson.documentUrl = undefined;
    lesson.documentPublicId = undefined;
    lesson.documentName = undefined;
    deleteDocument = true;
  } else if (input.lessonType === LESSON_TYPES.DOCUMENT) {
    lesson.textContent = undefined;
    lesson.videoUrl = undefined;
    lesson.videoPublicId = undefined;
    deleteVideo = true;
  }

  if (lesson.isPublished) assertLessonCanPublish(lesson);
  await lesson.save();
  if (wasPublished !== lesson.isPublished) await recalculateCourseEnrollments(lesson.courseId.toString());
  if (deleteVideo) await deleteStoredAsset(oldVideoPublicId, 'video');
  if (deleteDocument) await deleteStoredAsset(oldDocumentPublicId, 'raw');
  return normalizeMongo(lesson);
};

export const reorderLesson = async (instructorId: string, lessonId: string, input: ReorderLessonInput) => {
  const lesson = await getOwnedLesson(instructorId, lessonId);
  const lessons = await Lesson.find({ sectionId: lesson.sectionId }).sort({ order: 1 }).select('_id').lean();
  const ids = lessons.map((item) => item._id.toString()).filter((id) => id !== lessonId);
  ids.splice(Math.min(Math.max(input.order - 1, 0), ids.length), 0, lessonId);
  await Lesson.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: 100000 + index } } } })));
  await Lesson.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index + 1 } } } })));
  return normalizeMongo(await Lesson.findById(lessonId));
};

export const replaceLessonVideo = async (instructorId: string, lessonId: string, file: Express.Multer.File) => {
  const lesson = await getOwnedLesson(instructorId, lessonId, true);
  const oldPublicId = lesson.videoPublicId;
  const oldDocumentPublicId = lesson.documentPublicId;
  const uploaded = await uploadAssetBuffer({
    buffer: file.buffer,
    ownerId: lessonId,
    folder: 'lesson-videos',
    resourceType: 'video',
    originalFilename: file.originalname,
  });
  lesson.lessonType = LESSON_TYPES.VIDEO;
  lesson.textContent = undefined;
  lesson.documentUrl = undefined;
  lesson.documentPublicId = undefined;
  lesson.documentName = undefined;
  lesson.videoUrl = uploaded.url;
  lesson.videoPublicId = uploaded.publicId;
  await lesson.save();
  await Promise.all([
    deleteStoredAsset(oldPublicId, 'video'),
    deleteStoredAsset(oldDocumentPublicId, 'raw'),
  ]);
  return normalizeMongo(lesson);
};

export const replaceLessonDocument = async (instructorId: string, lessonId: string, file: Express.Multer.File) => {
  const lesson = await getOwnedLesson(instructorId, lessonId, true);
  const oldPublicId = lesson.documentPublicId;
  const oldVideoPublicId = lesson.videoPublicId;
  const uploaded = await uploadAssetBuffer({
    buffer: file.buffer,
    ownerId: lessonId,
    folder: 'lesson-documents',
    resourceType: 'raw',
    originalFilename: file.originalname,
  });
  lesson.lessonType = LESSON_TYPES.DOCUMENT;
  lesson.textContent = undefined;
  lesson.videoUrl = undefined;
  lesson.videoPublicId = undefined;
  lesson.documentUrl = uploaded.url;
  lesson.documentPublicId = uploaded.publicId;
  lesson.documentName = file.originalname;
  await lesson.save();
  await Promise.all([
    deleteStoredAsset(oldPublicId, 'raw'),
    deleteStoredAsset(oldVideoPublicId, 'video'),
  ]);
  return normalizeMongo(lesson);
};

export const removeLessonVideo = async (instructorId: string, lessonId: string) => {
  const lesson = await getOwnedLesson(instructorId, lessonId, true);
  if (lesson.isPublished && lesson.lessonType === LESSON_TYPES.VIDEO) {
    throw new AppError('Unpublish or change the lesson type before deleting its video', 409, 'PUBLISHED_LESSON_MEDIA_REQUIRED');
  }
  const publicId = lesson.videoPublicId;
  lesson.videoUrl = undefined;
  lesson.videoPublicId = undefined;
  await lesson.save();
  await deleteStoredAsset(publicId, 'video');
  return normalizeMongo(lesson);
};

export const removeLessonDocument = async (instructorId: string, lessonId: string) => {
  const lesson = await getOwnedLesson(instructorId, lessonId, true);
  if (lesson.isPublished && lesson.lessonType === LESSON_TYPES.DOCUMENT) {
    throw new AppError('Unpublish or change the lesson type before deleting its document', 409, 'PUBLISHED_LESSON_MEDIA_REQUIRED');
  }
  const publicId = lesson.documentPublicId;
  lesson.documentUrl = undefined;
  lesson.documentPublicId = undefined;
  lesson.documentName = undefined;
  await lesson.save();
  await deleteStoredAsset(publicId, 'raw');
  return normalizeMongo(lesson);
};

export const deleteLesson = async (instructorId: string, lessonId: string) => {
  const lesson = await getOwnedLesson(instructorId, lessonId, true);
  await Promise.all([
    LessonProgress.deleteMany({ lessonId }),
    Lesson.deleteOne({ _id: lessonId }),
  ]);
  const remaining = await Lesson.find({ sectionId: lesson.sectionId }).sort({ order: 1 }).select('_id').lean();
  if (remaining.length > 0) {
    await Lesson.bulkWrite(remaining.map((item, index) => ({ updateOne: { filter: { _id: item._id }, update: { $set: { order: index + 1 } } } })));
  }
  await recalculateCourseEnrollments(lesson.courseId.toString());
  await Promise.all([
    deleteStoredAsset(lesson.videoPublicId, 'video'),
    deleteStoredAsset(lesson.documentPublicId, 'raw'),
  ]);
};
