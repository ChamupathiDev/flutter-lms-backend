import mongoose from 'mongoose';
import { COURSE_STATUSES } from '../constants/lms.constants';
import { USER_ROLES, type UserRole } from '../constants/user.constants';
import { AppError } from '../errors/AppError';
import { Assignment } from '../models/assignment.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { CourseSection } from '../models/courseSection.model';
import { Lesson } from '../models/lesson.model';
import { LessonProgress } from '../models/lessonProgress.model';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { QuizQuestion } from '../models/quizQuestion.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import type { CreateSectionInput, ReorderSectionInput, UpdateSectionInput } from '../validators/section.validator';
import { deleteStoredAsset } from './fileUpload.service';
import { assertCourseContentAccess, getOwnedCourseOrThrow } from './lmsAccess.service';
import { recalculateCourseEnrollments } from './progress.service';

const reorderSections = async (courseId: string, sectionId: string, targetOrder: number) => {
  const sections = await CourseSection.find({ courseId }).sort({ order: 1 }).select('_id').lean();
  const ids = sections.map((section) => section._id.toString()).filter((id) => id !== sectionId);
  const insertionIndex = Math.min(Math.max(targetOrder - 1, 0), ids.length);
  ids.splice(insertionIndex, 0, sectionId);
  if (ids.length === 0) return;
  await CourseSection.bulkWrite(ids.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: 100000 + index } } },
  })));
  await CourseSection.bulkWrite(ids.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: index + 1 } } },
  })));
};

export const createSection = async (instructorId: string, courseId: string, input: CreateSectionInput) => {
  const course = await getOwnedCourseOrThrow(courseId, instructorId);
  if (course.status === COURSE_STATUSES.ARCHIVED) {
    throw new AppError('An archived course cannot be changed', 409, 'COURSE_ARCHIVED');
  }
  const lastSection = await CourseSection.findOne({ courseId }).sort({ order: -1 }).select('order').lean();
  const section = await CourseSection.create({
    courseId,
    ...input,
    order: (lastSection?.order ?? 0) + 1,
  });
  return normalizeMongo(section);
};

export const listCourseSections = async (userId: string, role: UserRole, courseId: string) => {
  await assertCourseContentAccess(userId, role, courseId);
  const filter: Record<string, unknown> = { courseId };
  if (role === USER_ROLES.STUDENT) filter.isPublished = true;
  const sections = await CourseSection.find(filter).sort({ order: 1 }).lean();
  const sectionIds = sections.map((section) => section._id);
  const lessonCounts = await Lesson.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { sectionId: { $in: sectionIds }, ...(role === USER_ROLES.STUDENT ? { isPublished: true } : {}) } },
    { $group: { _id: '$sectionId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(lessonCounts.map((item) => [item._id.toString(), item.count]));
  return normalizeMongo(sections.map((section) => ({
    ...section,
    lessonCount: countMap.get(section._id.toString()) ?? 0,
  })));
};

const getOwnedSection = async (instructorId: string, sectionId: string) => {
  const section = await CourseSection.findById(sectionId);
  if (!section) throw new AppError('Course section not found', 404, 'SECTION_NOT_FOUND');
  await getOwnedCourseOrThrow(section.courseId.toString(), instructorId);
  return section;
};

export const updateSection = async (instructorId: string, sectionId: string, input: UpdateSectionInput) => {
  const section = await getOwnedSection(instructorId, sectionId);
  if (input.title !== undefined) section.title = input.title;
  if (input.description !== undefined) section.description = input.description;
  const publicationChanged = input.isPublished !== undefined && input.isPublished !== section.isPublished;
  if (input.isPublished !== undefined) section.isPublished = input.isPublished;
  await section.save();
  if (publicationChanged) await recalculateCourseEnrollments(section.courseId.toString());
  return normalizeMongo(section);
};

export const reorderSection = async (instructorId: string, sectionId: string, input: ReorderSectionInput) => {
  const section = await getOwnedSection(instructorId, sectionId);
  await reorderSections(section.courseId.toString(), sectionId, input.order);
  return normalizeMongo(await CourseSection.findById(sectionId));
};

export const deleteSection = async (instructorId: string, sectionId: string) => {
  const section = await getOwnedSection(instructorId, sectionId);
  const lessons = await Lesson.find({ sectionId }).select('+videoPublicId +documentPublicId').lean();
  const quizzes = await Quiz.find({ sectionId }).select('_id').lean();
  const assignments = await Assignment.find({ sectionId }).select('+attachmentPublicId').lean();
  const lessonIds = lessons.map((lesson) => lesson._id);
  const quizIds = quizzes.map((quiz) => quiz._id);
  const assignmentIds = assignments.map((assignment) => assignment._id);
  const submissions = await AssignmentSubmission.find({ assignmentId: { $in: assignmentIds } }).select('+filePublicId').lean();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await LessonProgress.deleteMany({ lessonId: { $in: lessonIds } }).session(session);
      await Lesson.deleteMany({ sectionId }).session(session);
      await QuizAttempt.deleteMany({ quizId: { $in: quizIds } }).session(session);
      await QuizQuestion.deleteMany({ quizId: { $in: quizIds } }).session(session);
      await Quiz.deleteMany({ sectionId }).session(session);
      await AssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } }).session(session);
      await Assignment.deleteMany({ sectionId }).session(session);
      await CourseSection.deleteOne({ _id: sectionId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  const remaining = await CourseSection.find({ courseId: section.courseId }).sort({ order: 1 }).select('_id').lean();
  if (remaining.length > 0) {
    await CourseSection.bulkWrite(remaining.map((item, index) => ({
      updateOne: { filter: { _id: item._id }, update: { $set: { order: index + 1 } } },
    })));
  }

  await recalculateCourseEnrollments(section.courseId.toString());

  await Promise.all([
    ...lessons.flatMap((lesson) => [
      deleteStoredAsset(lesson.videoPublicId, 'video'),
      deleteStoredAsset(lesson.documentPublicId, 'raw'),
    ]),
    ...assignments.map((assignment) => deleteStoredAsset(assignment.attachmentPublicId, 'raw')),
    ...submissions.map((submission) => deleteStoredAsset(submission.filePublicId, 'raw')),
  ]);
};
