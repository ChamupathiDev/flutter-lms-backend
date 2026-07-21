import { Types } from 'mongoose';
import { COURSE_STATUSES, ENROLLMENT_STATUSES, QUIZ_ATTEMPT_STATUSES, SUBMISSION_STATUSES } from '../constants/lms.constants';
import { USER_ROLES, USER_STATUSES } from '../constants/user.constants';
import { Assignment } from '../models/assignment.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { Course } from '../models/course.model';
import { CourseSection } from '../models/courseSection.model';
import { Enrollment } from '../models/enrollment.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { User } from '../models/user.model';
import { normalizeMongo } from '../utils/normalizeMongo';

export const getStudentDashboard = async (studentId: string) => {
  const courseIds = await Enrollment.find({
    studentId,
    status: { $ne: ENROLLMENT_STATUSES.CANCELLED },
  }).distinct('courseId');

  const publishedSectionIds = await CourseSection.find({
    courseId: { $in: courseIds },
    isPublished: true,
  }).distinct('_id');
  const actionableAssignmentIds = await Assignment.find({
    courseId: { $in: courseIds },
    isPublished: true,
    $or: [
      { sectionId: { $exists: false } },
      { sectionId: null },
      { sectionId: { $in: publishedSectionIds } },
    ],
  }).distinct('_id');

  const alreadyHandledAssignmentIds = await AssignmentSubmission.find({
    studentId,
    assignmentId: { $in: actionableAssignmentIds },
    status: {
      $in: [
        SUBMISSION_STATUSES.SUBMITTED,
        SUBMISSION_STATUSES.LATE,
        SUBMISSION_STATUSES.GRADED,
      ],
    },
  }).distinct('assignmentId');

  const [totalEnrollments, activeCourses, completedCourses, recentEnrollments, recentQuizResults] = await Promise.all([
    Enrollment.countDocuments({ studentId, status: { $ne: ENROLLMENT_STATUSES.CANCELLED } }),
    Enrollment.countDocuments({ studentId, status: ENROLLMENT_STATUSES.ACTIVE }),
    Enrollment.countDocuments({ studentId, status: ENROLLMENT_STATUSES.COMPLETED }),
    Enrollment.find({ studentId, status: { $ne: ENROLLMENT_STATUSES.CANCELLED } })
      .populate('courseId', 'title thumbnailUrl')
      .sort({ lastAccessedAt: -1, enrolledAt: -1 })
      .limit(5)
      .lean(),
    QuizAttempt.find({ studentId, status: QUIZ_ATTEMPT_STATUSES.SUBMITTED })
      .populate('quizId', 'title')
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return normalizeMongo({
    totalEnrollments,
    activeCourses,
    completedCourses,
    pendingAssignments: Math.max(0, actionableAssignmentIds.length - alreadyHandledAssignmentIds.length),
    recentEnrollments,
    recentQuizResults,
  });
};

export const getInstructorDashboard = async (instructorId: string) => {
  const courseIds = await Course.find({ instructorId }).distinct('_id');
  const assignmentIds = await Assignment.find({ courseId: { $in: courseIds } }).distinct('_id');

  const [totalCourses, publishedCourses, draftCourses, archivedCourses, totalEnrollments, pendingSubmissions, ratingSummary] = await Promise.all([
    Course.countDocuments({ instructorId }),
    Course.countDocuments({ instructorId, status: COURSE_STATUSES.PUBLISHED }),
    Course.countDocuments({ instructorId, status: COURSE_STATUSES.DRAFT }),
    Course.countDocuments({ instructorId, status: COURSE_STATUSES.ARCHIVED }),
    Enrollment.countDocuments({ courseId: { $in: courseIds }, status: { $ne: ENROLLMENT_STATUSES.CANCELLED } }),
    AssignmentSubmission.countDocuments({
      assignmentId: { $in: assignmentIds },
      status: { $in: [SUBMISSION_STATUSES.SUBMITTED, SUBMISSION_STATUSES.LATE] },
    }),
    Course.aggregate<{ average: number }>([
      { $match: { instructorId: new Types.ObjectId(instructorId), reviewCount: { $gt: 0 } } },
      { $group: { _id: null, average: { $avg: '$averageRating' } } },
    ]),
  ]);

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    archivedCourses,
    totalEnrollments,
    pendingSubmissions,
    averageCourseRating: Math.round((ratingSummary[0]?.average ?? 0) * 100) / 100,
  };
};

export const getAdminDashboard = async () => {
  const [totalStudents, totalInstructors, activeUsers, publishedCourses, totalEnrollments, completedEnrollments] = await Promise.all([
    User.countDocuments({ role: USER_ROLES.STUDENT }),
    User.countDocuments({ role: USER_ROLES.INSTRUCTOR }),
    User.countDocuments({ status: USER_STATUSES.ACTIVE }),
    Course.countDocuments({ status: COURSE_STATUSES.PUBLISHED }),
    Enrollment.countDocuments({ status: { $ne: ENROLLMENT_STATUSES.CANCELLED } }),
    Enrollment.countDocuments({ status: ENROLLMENT_STATUSES.COMPLETED }),
  ]);
  return { totalStudents, totalInstructors, activeUsers, publishedCourses, totalEnrollments, completedEnrollments };
};
