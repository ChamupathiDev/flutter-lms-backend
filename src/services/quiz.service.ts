import mongoose from 'mongoose';
import { NOTIFICATION_TYPES, QUIZ_ATTEMPT_STATUSES, QUIZ_QUESTION_TYPES, RELATED_ENTITY_TYPES } from '../constants/lms.constants';
import { AppError } from '../errors/AppError';
import { CourseSection } from '../models/courseSection.model';
import { Quiz } from '../models/quiz.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { QuizQuestion } from '../models/quizQuestion.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import {
  createQuizQuestionBodySchema,
  type CreateQuizInput,
  type CreateQuizQuestionInput,
  type SubmitQuizAttemptInput,
  type UpdateQuizInput,
  type UpdateQuizQuestionInput,
} from '../validators/quiz.validator';
import { getEnrollmentOrThrow, getOwnedCourseOrThrow } from './lmsAccess.service';
import { createNotification } from './notification.service';

const getOwnedQuiz = async (instructorId: string, quizId: string) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new AppError('Quiz not found', 404, 'QUIZ_NOT_FOUND');
  await getOwnedCourseOrThrow(quiz.courseId.toString(), instructorId);
  return quiz;
};

const assertSectionBelongsToCourse = async (sectionId: string | undefined | null, courseId: string) => {
  if (!sectionId) return;
  const section = await CourseSection.findOne({ _id: sectionId, courseId });
  if (!section) {
    throw new AppError('The selected section does not belong to this course', 422, 'INVALID_COURSE_SECTION');
  }
};

const studentQuestion = (question: { _id: mongoose.Types.ObjectId; questionText: string; questionType: string; options: unknown[]; marks: number; order: number }) => ({
  id: question._id.toString(),
  questionText: question.questionText,
  questionType: question.questionType,
  options: question.options,
  marks: question.marks,
  order: question.order,
});

export const createQuiz = async (instructorId: string, courseId: string, input: CreateQuizInput) => {
  await getOwnedCourseOrThrow(courseId, instructorId);
  await assertSectionBelongsToCourse(input.sectionId, courseId);
  const quiz = await Quiz.create({ courseId, ...input });
  return normalizeMongo(quiz);
};

export const listInstructorQuizzes = async (instructorId: string, courseId: string) => {
  await getOwnedCourseOrThrow(courseId, instructorId);
  const quizzes = await Quiz.find({ courseId }).populate('sectionId', 'title order').sort({ createdAt: -1 }).lean();
  const questionCounts = await QuizQuestion.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { quizId: { $in: quizzes.map((quiz) => quiz._id) } } },
    { $group: { _id: '$quizId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(questionCounts.map((item) => [item._id.toString(), item.count]));
  return normalizeMongo(quizzes.map((quiz) => ({ ...quiz, questionCount: countMap.get(quiz._id.toString()) ?? 0 })));
};

export const getInstructorQuiz = async (instructorId: string, quizId: string) => {
  const quiz = await getOwnedQuiz(instructorId, quizId);
  const questions = await QuizQuestion.find({ quizId }).sort({ order: 1 }).lean();
  return { quiz: normalizeMongo(quiz), questions: normalizeMongo(questions) };
};

export const updateQuiz = async (instructorId: string, quizId: string, input: UpdateQuizInput) => {
  const quiz = await getOwnedQuiz(instructorId, quizId);
  if (quiz.isPublished) {
    throw new AppError('Unpublish is not supported; published quiz settings cannot be edited', 409, 'QUIZ_ALREADY_PUBLISHED');
  }
  if (input.sectionId !== undefined) {
    await assertSectionBelongsToCourse(input.sectionId, quiz.courseId.toString());
    quiz.sectionId = input.sectionId ? new mongoose.Types.ObjectId(input.sectionId) : undefined;
  }
  if (input.title !== undefined) quiz.title = input.title;
  if (input.description !== undefined) quiz.description = input.description;
  if (input.passingScore !== undefined) quiz.passingScore = input.passingScore;
  if (input.timeLimitMinutes !== undefined) quiz.timeLimitMinutes = input.timeLimitMinutes;
  if (input.maxAttempts !== undefined) quiz.maxAttempts = input.maxAttempts;
  await quiz.save();
  return normalizeMongo(quiz);
};

export const deleteQuiz = async (instructorId: string, quizId: string) => {
  const quiz = await getOwnedQuiz(instructorId, quizId);
  if (quiz.isPublished && await QuizAttempt.exists({ quizId })) {
    throw new AppError('A published quiz with attempts cannot be deleted', 409, 'QUIZ_HAS_ATTEMPTS');
  }
  await Promise.all([
    QuizQuestion.deleteMany({ quizId }),
    QuizAttempt.deleteMany({ quizId }),
    Quiz.deleteOne({ _id: quizId }),
  ]);
};

export const createQuizQuestion = async (instructorId: string, quizId: string, input: CreateQuizQuestionInput) => {
  const quiz = await getOwnedQuiz(instructorId, quizId);
  if (quiz.isPublished) throw new AppError('Questions cannot be changed after publishing', 409, 'QUIZ_ALREADY_PUBLISHED');
  const lastQuestion = await QuizQuestion.findOne({ quizId }).sort({ order: -1 }).select('order').lean();
  const question = await QuizQuestion.create({ quizId, ...input, order: (lastQuestion?.order ?? 0) + 1 });
  return normalizeMongo(question);
};

export const updateQuizQuestion = async (instructorId: string, questionId: string, input: UpdateQuizQuestionInput) => {
  const question = await QuizQuestion.findById(questionId);
  if (!question) throw new AppError('Quiz question not found', 404, 'QUIZ_QUESTION_NOT_FOUND');
  const quiz = await getOwnedQuiz(instructorId, question.quizId.toString());
  if (quiz.isPublished) throw new AppError('Questions cannot be changed after publishing', 409, 'QUIZ_ALREADY_PUBLISHED');

  const merged = createQuizQuestionBodySchema.parse({
    questionText: input.questionText ?? question.questionText,
    questionType: input.questionType ?? question.questionType,
    options: input.options ?? question.options.map((option) => ({ id: option.id, text: option.text })),
    correctOptionIds: input.correctOptionIds ?? question.correctOptionIds,
    marks: input.marks ?? question.marks,
  });
  question.set(merged);
  await question.save();
  return normalizeMongo(question);
};

export const deleteQuizQuestion = async (instructorId: string, questionId: string) => {
  const question = await QuizQuestion.findById(questionId);
  if (!question) throw new AppError('Quiz question not found', 404, 'QUIZ_QUESTION_NOT_FOUND');
  const quiz = await getOwnedQuiz(instructorId, question.quizId.toString());
  if (quiz.isPublished) throw new AppError('Questions cannot be changed after publishing', 409, 'QUIZ_ALREADY_PUBLISHED');
  await question.deleteOne();
  const remaining = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 }).select('_id').lean();
  if (remaining.length > 0) {
    await QuizQuestion.bulkWrite(remaining.map((item, index) => ({
      updateOne: { filter: { _id: item._id }, update: { $set: { order: index + 1 } } },
    })));
  }
};

export const publishQuiz = async (instructorId: string, quizId: string) => {
  const quiz = await getOwnedQuiz(instructorId, quizId);
  if (quiz.isPublished) return normalizeMongo(quiz);
  if (quiz.sectionId && !await CourseSection.exists({ _id: quiz.sectionId, isPublished: true })) {
    throw new AppError('Publish the selected course section before publishing this quiz', 409, 'SECTION_NOT_PUBLISHED');
  }
  if (!await QuizQuestion.exists({ quizId })) {
    throw new AppError('Add at least one question before publishing the quiz', 409, 'QUIZ_QUESTION_REQUIRED');
  }
  quiz.isPublished = true;
  await quiz.save();
  return normalizeMongo(quiz);
};

export const listStudentQuizzes = async (studentId: string, courseId: string) => {
  await getEnrollmentOrThrow(studentId, courseId);
  const publishedSectionIds = await CourseSection.find({ courseId, isPublished: true }).distinct('_id');
  const quizzes = await Quiz.find({
    courseId,
    isPublished: true,
    $or: [
      { sectionId: { $exists: false } },
      { sectionId: null },
      { sectionId: { $in: publishedSectionIds } },
    ],
  })
    .populate('sectionId', 'title order isPublished')
    .sort({ createdAt: 1 })
    .lean();
  return normalizeMongo(quizzes);
};

export const getStudentQuiz = async (studentId: string, quizId: string) => {
  const quiz = await Quiz.findOne({ _id: quizId, isPublished: true }).lean();
  if (!quiz) throw new AppError('Published quiz not found', 404, 'QUIZ_NOT_FOUND');
  await getEnrollmentOrThrow(studentId, quiz.courseId.toString());
  if (quiz.sectionId && !await CourseSection.exists({ _id: quiz.sectionId, isPublished: true })) {
    throw new AppError('This quiz section is not published', 403, 'SECTION_NOT_PUBLISHED');
  }
  const questions = await QuizQuestion.find({ quizId }).sort({ order: 1 }).lean();
  return {
    quiz: normalizeMongo(quiz),
    questions: questions.map(studentQuestion),
  };
};

export const startQuizAttempt = async (studentId: string, quizId: string) => {
  const quiz = await Quiz.findOne({ _id: quizId, isPublished: true });
  if (!quiz) throw new AppError('Published quiz not found', 404, 'QUIZ_NOT_FOUND');
  const enrollment = await getEnrollmentOrThrow(studentId, quiz.courseId.toString());
  const activeAttempt = await QuizAttempt.findOne({ quizId, studentId, status: QUIZ_ATTEMPT_STATUSES.IN_PROGRESS });
  if (activeAttempt) {
    const expired = quiz.timeLimitMinutes > 0 &&
      Date.now() > activeAttempt.startedAt.getTime() + (quiz.timeLimitMinutes * 60 * 1000) + 30000;
    if (!expired) {
      throw new AppError('You already have an active attempt for this quiz', 409, 'QUIZ_ATTEMPT_ALREADY_ACTIVE');
    }
    const totalMarks = await QuizQuestion.aggregate<{ total: number }>([
      { $match: { quizId: quiz._id } },
      { $group: { _id: null, total: { $sum: '$marks' } } },
    ]);
    activeAttempt.answers = [];
    activeAttempt.score = 0;
    activeAttempt.totalMarks = totalMarks[0]?.total ?? 0;
    activeAttempt.percentage = 0;
    activeAttempt.passed = false;
    activeAttempt.status = QUIZ_ATTEMPT_STATUSES.SUBMITTED;
    activeAttempt.submittedAt = new Date();
    await activeAttempt.save();
  }
  const previousAttempts = await QuizAttempt.countDocuments({ quizId, studentId, status: QUIZ_ATTEMPT_STATUSES.SUBMITTED });
  if (previousAttempts >= quiz.maxAttempts) {
    throw new AppError('The maximum number of quiz attempts has been reached', 409, 'MAX_QUIZ_ATTEMPTS_REACHED');
  }
  const attempt = await QuizAttempt.create({
    quizId,
    studentId,
    enrollmentId: enrollment._id,
    attemptNumber: previousAttempts + 1,
  });
  return normalizeMongo(attempt);
};

const equalAnswerSets = (left: string[], right: string[]) => {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

export const submitQuizAttempt = async (studentId: string, attemptId: string, input: SubmitQuizAttemptInput) => {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId });
  if (!attempt) throw new AppError('Quiz attempt not found', 404, 'QUIZ_ATTEMPT_NOT_FOUND');
  if (attempt.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED) {
    throw new AppError('This quiz attempt has already been submitted', 409, 'QUIZ_ATTEMPT_ALREADY_SUBMITTED');
  }
  const quiz = await Quiz.findById(attempt.quizId);
  if (!quiz) throw new AppError('Quiz not found', 404, 'QUIZ_NOT_FOUND');
  const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 });
  if (questions.length === 0) throw new AppError('This quiz has no questions', 409, 'QUIZ_HAS_NO_QUESTIONS');

  const submittedQuestionIds = input.answers.map((answer) => answer.questionId);
  if (new Set(submittedQuestionIds).size !== submittedQuestionIds.length) {
    throw new AppError('A quiz question can be answered only once', 422, 'DUPLICATE_QUIZ_ANSWER');
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  for (const answer of input.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      throw new AppError('An answer references a question outside this quiz', 422, 'INVALID_QUIZ_QUESTION');
    }
    const selectedIds = [...new Set(answer.selectedOptionIds)];
    if (selectedIds.length !== answer.selectedOptionIds.length) {
      throw new AppError('Selected option IDs must be unique', 422, 'DUPLICATE_SELECTED_OPTION');
    }
    const validOptionIds = new Set(question.options.map((option) => option.id));
    if (selectedIds.some((id) => !validOptionIds.has(id))) {
      throw new AppError('An answer contains an invalid option', 422, 'INVALID_QUIZ_OPTION');
    }
    if (
      (question.questionType === QUIZ_QUESTION_TYPES.SINGLE_CHOICE ||
        question.questionType === QUIZ_QUESTION_TYPES.TRUE_FALSE) &&
      selectedIds.length > 1
    ) {
      throw new AppError('This question accepts only one option', 422, 'MULTIPLE_OPTIONS_NOT_ALLOWED');
    }
  }

  const timedOut = quiz.timeLimitMinutes > 0 &&
    Date.now() > attempt.startedAt.getTime() + (quiz.timeLimitMinutes * 60 * 1000) + 30000;
  const answerMap = new Map(
    (timedOut ? [] : input.answers).map((answer) => [answer.questionId, answer.selectedOptionIds]),
  );
  let score = 0;
  let totalMarks = 0;
  for (const question of questions) {
    totalMarks += question.marks;
    const selected = answerMap.get(question.id) ?? [];
    if (equalAnswerSets(selected, question.correctOptionIds)) score += question.marks;
  }
  const percentage = totalMarks === 0 ? 0 : Math.round((score / totalMarks) * 10000) / 100;
  attempt.answers = (timedOut ? [] : input.answers).map((answer) => ({
    questionId: new mongoose.Types.ObjectId(answer.questionId),
    selectedOptionIds: answer.selectedOptionIds,
  }));
  attempt.score = score;
  attempt.totalMarks = totalMarks;
  attempt.percentage = percentage;
  attempt.passed = percentage >= quiz.passingScore;
  attempt.status = QUIZ_ATTEMPT_STATUSES.SUBMITTED;
  attempt.submittedAt = new Date();
  await attempt.save();

  await createNotification({
    userId: studentId,
    type: NOTIFICATION_TYPES.QUIZ_RESULT,
    title: 'Quiz result available',
    message: timedOut
      ? `Your attempt for ${quiz.title} expired and was submitted with 0%.`
      : `You scored ${percentage}% for ${quiz.title}.`,
    relatedEntityType: RELATED_ENTITY_TYPES.QUIZ_ATTEMPT,
    relatedEntityId: attempt._id,
  });

  return {
    attempt: normalizeMongo(attempt),
    result: {
      score,
      totalMarks,
      percentage,
      passed: attempt.passed,
      passingScore: quiz.passingScore,
      timedOut,
    },
  };
};

export const listMyQuizAttempts = async (studentId: string, quizId: string, page: number, limit: number) => {
  const pagination = getPagination({ page, limit });
  const [attempts, totalItems] = await Promise.all([
    QuizAttempt.find({ quizId, studentId }).sort({ attemptNumber: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    QuizAttempt.countDocuments({ quizId, studentId }),
  ]);
  return { attempts: normalizeMongo(attempts), pagination: createPaginationMetadata(page, limit, totalItems) };
};

export const listQuizAttemptsForInstructor = async (instructorId: string, quizId: string, page: number, limit: number) => {
  await getOwnedQuiz(instructorId, quizId);
  const pagination = getPagination({ page, limit });
  const [attempts, totalItems] = await Promise.all([
    QuizAttempt.find({ quizId }).populate('studentId', 'firstName lastName email').sort({ submittedAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    QuizAttempt.countDocuments({ quizId }),
  ]);
  return { attempts: normalizeMongo(attempts), pagination: createPaginationMetadata(page, limit, totalItems) };
};
