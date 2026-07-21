import mongoose from 'mongoose';
import { ENROLLMENT_STATUSES, NOTIFICATION_TYPES, RELATED_ENTITY_TYPES, SUBMISSION_STATUSES } from '../constants/lms.constants';
import { AppError } from '../errors/AppError';
import { Assignment } from '../models/assignment.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { CourseSection } from '../models/courseSection.model';
import { Enrollment } from '../models/enrollment.model';
import { normalizeMongo } from '../utils/normalizeMongo';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import type {
  CreateAssignmentInput,
  GradeSubmissionInput,
  ListSubmissionsQuery,
  SubmitAssignmentInput,
  UpdateAssignmentInput,
  UpdateSubmissionInput,
} from '../validators/assignment.validator';
import { deleteStoredAsset, uploadAssetBuffer } from './fileUpload.service';
import { getEnrollmentOrThrow, getOwnedCourseOrThrow } from './lmsAccess.service';
import { createNotification, createNotifications } from './notification.service';

const getOwnedAssignment = async (instructorId: string, assignmentId: string, includeFiles = false) => {
  const query = Assignment.findById(assignmentId);
  if (includeFiles) query.select('+attachmentPublicId');
  const assignment = await query;
  if (!assignment) throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  await getOwnedCourseOrThrow(assignment.courseId.toString(), instructorId);
  return assignment;
};

const assertSection = async (sectionId: string | undefined | null, courseId: string) => {
  if (!sectionId) return;
  if (!await CourseSection.exists({ _id: sectionId, courseId })) {
    throw new AppError('The selected section does not belong to this course', 422, 'INVALID_COURSE_SECTION');
  }
};

export const createAssignment = async (instructorId: string, courseId: string, input: CreateAssignmentInput) => {
  await getOwnedCourseOrThrow(courseId, instructorId);
  await assertSection(input.sectionId, courseId);
  return normalizeMongo(await Assignment.create({ courseId, ...input }));
};

export const listInstructorAssignments = async (instructorId: string, courseId: string) => {
  await getOwnedCourseOrThrow(courseId, instructorId);
  return normalizeMongo(await Assignment.find({ courseId }).populate('sectionId', 'title order').sort({ createdAt: -1 }).lean());
};

export const updateAssignment = async (instructorId: string, assignmentId: string, input: UpdateAssignmentInput) => {
  const assignment = await getOwnedAssignment(instructorId, assignmentId);
  if (input.sectionId !== undefined) {
    await assertSection(input.sectionId, assignment.courseId.toString());
    assignment.sectionId = input.sectionId ? new mongoose.Types.ObjectId(input.sectionId) : undefined;
  }
  if (input.title !== undefined) assignment.title = input.title;
  if (input.description !== undefined) assignment.description = input.description;
  if (input.instructions !== undefined) assignment.instructions = input.instructions;
  if (input.dueDate !== undefined) assignment.dueDate = input.dueDate ?? undefined;
  if (input.maximumMarks !== undefined) {
    const highestAward = await AssignmentSubmission.findOne({ assignmentId })
      .sort({ marksAwarded: -1 })
      .select('marksAwarded')
      .lean();
    if ((highestAward?.marksAwarded ?? 0) > input.maximumMarks) {
      throw new AppError('Maximum marks cannot be lower than marks already awarded', 409, 'MAXIMUM_MARKS_BELOW_AWARDED_MARKS');
    }
    assignment.maximumMarks = input.maximumMarks;
  }
  await assignment.save();
  return normalizeMongo(assignment);
};

export const replaceAssignmentAttachment = async (instructorId: string, assignmentId: string, file: Express.Multer.File) => {
  const assignment = await getOwnedAssignment(instructorId, assignmentId, true);
  const oldPublicId = assignment.attachmentPublicId;
  const uploaded = await uploadAssetBuffer({
    buffer: file.buffer,
    ownerId: assignmentId,
    folder: 'assignment-resources',
    resourceType: 'raw',
    originalFilename: file.originalname,
  });
  assignment.attachmentUrl = uploaded.url;
  assignment.attachmentPublicId = uploaded.publicId;
  assignment.attachmentName = file.originalname;
  await assignment.save();
  await deleteStoredAsset(oldPublicId, 'raw');
  return normalizeMongo(assignment);
};

export const removeAssignmentAttachment = async (instructorId: string, assignmentId: string) => {
  const assignment = await getOwnedAssignment(instructorId, assignmentId, true);
  const oldPublicId = assignment.attachmentPublicId;
  assignment.attachmentUrl = undefined;
  assignment.attachmentPublicId = undefined;
  assignment.attachmentName = undefined;
  await assignment.save();
  await deleteStoredAsset(oldPublicId, 'raw');
  return normalizeMongo(assignment);
};

export const publishAssignment = async (instructorId: string, assignmentId: string) => {
  const assignment = await getOwnedAssignment(instructorId, assignmentId);
  if (assignment.isPublished) return normalizeMongo(assignment);
  if (assignment.sectionId && !await CourseSection.exists({ _id: assignment.sectionId, isPublished: true })) {
    throw new AppError('Publish the selected course section before publishing this assignment', 409, 'SECTION_NOT_PUBLISHED');
  }
  assignment.isPublished = true;
  await assignment.save();
  const enrollments = await Enrollment.find({
    courseId: assignment.courseId,
    status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
  }).select('studentId').lean();
  await createNotifications(enrollments.map((enrollment) => ({
    userId: enrollment.studentId,
    type: NOTIFICATION_TYPES.ASSIGNMENT_PUBLISHED,
    title: 'New assignment',
    message: `${assignment.title} is now available.`,
    relatedEntityType: RELATED_ENTITY_TYPES.ASSIGNMENT,
    relatedEntityId: assignment._id,
  })));
  return normalizeMongo(assignment);
};

export const deleteAssignment = async (instructorId: string, assignmentId: string) => {
  const assignment = await getOwnedAssignment(instructorId, assignmentId, true);
  const submissions = await AssignmentSubmission.find({ assignmentId }).select('+filePublicId').lean();
  if (submissions.length > 0) {
    throw new AppError('An assignment with submissions cannot be deleted', 409, 'ASSIGNMENT_HAS_SUBMISSIONS');
  }
  await Promise.all([
    AssignmentSubmission.deleteMany({ assignmentId }),
    Assignment.deleteOne({ _id: assignmentId }),
  ]);
  await Promise.all([
    deleteStoredAsset(assignment.attachmentPublicId, 'raw'),
    ...submissions.map((submission) => deleteStoredAsset(submission.filePublicId, 'raw')),
  ]);
};

export const listStudentAssignments = async (studentId: string, courseId: string) => {
  await getEnrollmentOrThrow(studentId, courseId);
  const publishedSectionIds = await CourseSection.find({ courseId, isPublished: true }).distinct('_id');
  const assignments = await Assignment.find({
    courseId,
    isPublished: true,
    $or: [
      { sectionId: { $exists: false } },
      { sectionId: null },
      { sectionId: { $in: publishedSectionIds } },
    ],
  })
    .populate('sectionId', 'title order isPublished')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();
  return normalizeMongo(assignments);
};

export const getStudentAssignment = async (studentId: string, assignmentId: string) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, isPublished: true }).lean();
  if (!assignment) throw new AppError('Published assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  await getEnrollmentOrThrow(studentId, assignment.courseId.toString());
  if (assignment.sectionId && !await CourseSection.exists({ _id: assignment.sectionId, isPublished: true })) {
    throw new AppError('This assignment section is not published', 403, 'SECTION_NOT_PUBLISHED');
  }
  return normalizeMongo(assignment);
};

export const submitAssignment = async (
  studentId: string,
  assignmentId: string,
  input: SubmitAssignmentInput,
  file?: Express.Multer.File,
) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, isPublished: true });
  if (!assignment) throw new AppError('Published assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  const enrollment = await getEnrollmentOrThrow(studentId, assignment.courseId.toString());
  if (assignment.sectionId && !await CourseSection.exists({ _id: assignment.sectionId, isPublished: true })) {
    throw new AppError('This assignment section is not published', 403, 'SECTION_NOT_PUBLISHED');
  }
  if (!input.textAnswer && !file) {
    throw new AppError('Provide a text answer or a submission file', 422, 'SUBMISSION_CONTENT_REQUIRED');
  }

  let uploaded: Awaited<ReturnType<typeof uploadAssetBuffer>> | undefined;
  if (file) {
    uploaded = await uploadAssetBuffer({
      buffer: file.buffer,
      ownerId: `${studentId}-${assignmentId}`,
      folder: 'assignment-submissions',
      resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw',
      originalFilename: file.originalname,
    });
  }

  const existing = await AssignmentSubmission.findOne({ assignmentId, studentId }).select('+filePublicId');
  if (existing && existing.status === SUBMISSION_STATUSES.GRADED) {
    if (uploaded) await deleteStoredAsset(uploaded.publicId, uploaded.resourceType);
    throw new AppError('A graded submission cannot be replaced', 409, 'SUBMISSION_ALREADY_GRADED');
  }

  const now = new Date();
  const status = assignment.dueDate && now > assignment.dueDate
    ? SUBMISSION_STATUSES.LATE
    : SUBMISSION_STATUSES.SUBMITTED;
  const oldFilePublicId = existing?.filePublicId;
  const oldFileResourceType = existing?.fileUrl?.match(/\/image\/upload\//) ? 'image' : 'raw';
  const submission = existing ?? new AssignmentSubmission({ assignmentId, studentId, enrollmentId: enrollment._id });
  submission.textAnswer = input.textAnswer;
  submission.status = status;
  submission.submittedAt = now;
  submission.marksAwarded = undefined;
  submission.feedback = undefined;
  submission.gradedAt = undefined;
  submission.gradedBy = undefined;
  if (uploaded) {
    submission.fileUrl = uploaded.url;
    submission.filePublicId = uploaded.publicId;
    submission.fileName = file?.originalname;
  }
  try {
    await submission.save();
  } catch (error) {
    if (uploaded) await deleteStoredAsset(uploaded.publicId, uploaded.resourceType);
    throw error;
  }
  if (uploaded) await deleteStoredAsset(oldFilePublicId, oldFileResourceType);
  return normalizeMongo(submission);
};

export const getMySubmission = async (studentId: string, assignmentId: string) => {
  const submission = await AssignmentSubmission.findOne({ assignmentId, studentId });
  if (!submission) throw new AppError('Assignment submission not found', 404, 'SUBMISSION_NOT_FOUND');
  return normalizeMongo(submission);
};

export const updateMySubmission = async (studentId: string, submissionId: string, input: UpdateSubmissionInput) => {
  const submission = await AssignmentSubmission.findOne({ _id: submissionId, studentId });
  if (!submission) throw new AppError('Assignment submission not found', 404, 'SUBMISSION_NOT_FOUND');
  if (submission.status === SUBMISSION_STATUSES.GRADED) {
    throw new AppError('A graded submission cannot be edited', 409, 'SUBMISSION_ALREADY_GRADED');
  }
  if (!input.textAnswer && !submission.fileUrl) {
    throw new AppError('A submission must contain text or a file', 422, 'SUBMISSION_CONTENT_REQUIRED');
  }
  const assignment = await Assignment.findById(submission.assignmentId).select('dueDate').lean();
  submission.textAnswer = input.textAnswer;
  submission.status = assignment?.dueDate && new Date() > assignment.dueDate
    ? SUBMISSION_STATUSES.LATE
    : SUBMISSION_STATUSES.SUBMITTED;
  submission.submittedAt = new Date();
  submission.marksAwarded = undefined;
  submission.feedback = undefined;
  submission.gradedAt = undefined;
  submission.gradedBy = undefined;
  await submission.save();
  return normalizeMongo(submission);
};

export const replaceSubmissionFile = async (studentId: string, submissionId: string, file: Express.Multer.File) => {
  const submission = await AssignmentSubmission.findOne({ _id: submissionId, studentId }).select('+filePublicId');
  if (!submission) throw new AppError('Assignment submission not found', 404, 'SUBMISSION_NOT_FOUND');
  if (submission.status === SUBMISSION_STATUSES.GRADED) {
    throw new AppError('A graded submission cannot be edited', 409, 'SUBMISSION_ALREADY_GRADED');
  }
  const uploaded = await uploadAssetBuffer({
    buffer: file.buffer,
    ownerId: submissionId,
    folder: 'assignment-submissions',
    resourceType: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    originalFilename: file.originalname,
  });
  const oldPublicId = submission.filePublicId;
  const oldType = submission.fileUrl?.match(/\/image\/upload\//) ? 'image' : 'raw';
  const assignment = await Assignment.findById(submission.assignmentId).select('dueDate').lean();
  submission.fileUrl = uploaded.url;
  submission.filePublicId = uploaded.publicId;
  submission.fileName = file.originalname;
  submission.status = assignment?.dueDate && new Date() > assignment.dueDate
    ? SUBMISSION_STATUSES.LATE
    : SUBMISSION_STATUSES.SUBMITTED;
  submission.submittedAt = new Date();
  submission.marksAwarded = undefined;
  submission.feedback = undefined;
  submission.gradedAt = undefined;
  submission.gradedBy = undefined;
  await submission.save();
  await deleteStoredAsset(oldPublicId, oldType);
  return normalizeMongo(submission);
};

export const listAssignmentSubmissions = async (
  instructorId: string,
  assignmentId: string,
  query: ListSubmissionsQuery,
) => {
  await getOwnedAssignment(instructorId, assignmentId);
  const filter: Record<string, unknown> = { assignmentId };
  if (query.status) filter.status = query.status;
  const pagination = getPagination(query);
  const [submissions, totalItems] = await Promise.all([
    AssignmentSubmission.find(filter).populate('studentId', 'firstName lastName email profileImageUrl').sort({ submittedAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    AssignmentSubmission.countDocuments(filter),
  ]);
  return { submissions: normalizeMongo(submissions), pagination: createPaginationMetadata(query.page, query.limit, totalItems) };
};

export const gradeSubmission = async (
  instructorId: string,
  submissionId: string,
  input: GradeSubmissionInput,
) => {
  const submission = await AssignmentSubmission.findById(submissionId);
  if (!submission) throw new AppError('Assignment submission not found', 404, 'SUBMISSION_NOT_FOUND');
  const assignment = await getOwnedAssignment(instructorId, submission.assignmentId.toString());
  if (input.marksAwarded > assignment.maximumMarks) {
    throw new AppError(`Marks cannot exceed ${assignment.maximumMarks}`, 422, 'MARKS_EXCEED_MAXIMUM');
  }
  submission.marksAwarded = input.marksAwarded;
  submission.feedback = input.feedback;
  submission.status = input.status;
  submission.gradedAt = new Date();
  submission.gradedBy = new mongoose.Types.ObjectId(instructorId);
  await submission.save();
  await createNotification({
    userId: submission.studentId,
    type: NOTIFICATION_TYPES.ASSIGNMENT_GRADED,
    title: 'Assignment graded',
    message: input.status === SUBMISSION_STATUSES.RESUBMISSION_REQUIRED
      ? `${assignment.title} requires resubmission.`
      : `${assignment.title} has been graded.`,
    relatedEntityType: RELATED_ENTITY_TYPES.SUBMISSION,
    relatedEntityId: submission._id,
  });
  return normalizeMongo(submission);
};
