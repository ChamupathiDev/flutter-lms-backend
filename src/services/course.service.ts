import { Types, type QueryFilter } from 'mongoose';
import { COURSE_STATUSES } from '../constants/lms.constants';
import { AppError } from '../errors/AppError';
import { Course, type ICourse } from '../models/course.model';
import { CourseCategory } from '../models/courseCategory.model';
import { CourseSection } from '../models/courseSection.model';
import { Lesson } from '../models/lesson.model';
import { escapeRegex } from '../utils/escapeRegex';
import { normalizeMongo } from '../utils/normalizeMongo';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import { toSlug } from '../utils/slug';
import type {
  CreateCourseInput,
  ListAdminCoursesQuery,
  ListCoursesQuery,
  ListInstructorCoursesQuery,
  UpdateCourseInput,
} from '../validators/course.validator';
import { deleteStoredAsset, uploadAssetBuffer } from './fileUpload.service';
import { getCourseOrThrow, getOwnedCourseOrThrow } from './lmsAccess.service';

const uniqueCourseSlug = async (title: string, excludeId?: string) => {
  const base = toSlug(title) || 'course';
  let slug = base;
  let counter = 1;
  while (await Course.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return slug;
};

const assertActiveCategory = async (categoryId: string) => {
  const category = await CourseCategory.findOne({ _id: categoryId, isActive: true });
  if (!category) {
    throw new AppError('An active course category is required', 422, 'ACTIVE_CATEGORY_REQUIRED');
  }
  return category;
};

const populateCourseQuery = (query: any): any =>
  query
    .populate('categoryId', 'name slug isActive')
    .populate('instructorId', 'firstName lastName profileImageUrl bio');

export const createCourse = async (instructorId: string, input: CreateCourseInput) => {
  await assertActiveCategory(input.categoryId);
  const course = await Course.create({
    ...input,
    instructorId,
    slug: await uniqueCourseSlug(input.title),
    isFree: true,
    price: 0,
  });
  return normalizeMongo(await populateCourseQuery(Course.findById(course.id)).lean());
};

export const listPublishedCourses = async (query: ListCoursesQuery) => {
  const filter: QueryFilter<ICourse> = { status: COURSE_STATUSES.PUBLISHED };
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.level) filter.level = query.level;
  if (query.language) filter.language = { $regex: `^${escapeRegex(query.language)}$`, $options: 'i' };
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const pagination = getPagination(query);
  const [courses, totalItems] = await Promise.all([
    populateCourseQuery(Course.find(filter)).sort({ publishedAt: -1, createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Course.countDocuments(filter),
  ]);
  return {
    courses: normalizeMongo(courses),
    pagination: createPaginationMetadata(query.page, query.limit, totalItems),
  };
};

export const getPublishedCourse = async (courseId: string) => {
  const course = await populateCourseQuery(
    Course.findOne({ _id: courseId, status: COURSE_STATUSES.PUBLISHED }),
  ).lean();
  if (!course) throw new AppError('Published course not found', 404, 'COURSE_NOT_FOUND');
  return normalizeMongo(course);
};

export const listInstructorCourses = async (instructorId: string, query: ListInstructorCoursesQuery) => {
  const filter: QueryFilter<ICourse> = { instructorId };
  if (query.status) filter.status = query.status;
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
    ];
  }
  const pagination = getPagination(query);
  const [courses, totalItems] = await Promise.all([
    Course.find(filter).populate('categoryId', 'name slug isActive').sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Course.countDocuments(filter),
  ]);
  return {
    courses: normalizeMongo(courses),
    pagination: createPaginationMetadata(query.page, query.limit, totalItems),
  };
};

export const getInstructorCourse = async (instructorId: string, courseId: string) => {
  await getOwnedCourseOrThrow(courseId, instructorId);
  const course = await populateCourseQuery(Course.findById(courseId)).lean();
  return normalizeMongo(course);
};

export const updateCourse = async (instructorId: string, courseId: string, input: UpdateCourseInput) => {
  const course = await getOwnedCourseOrThrow(courseId, instructorId);
  if (course.status === COURSE_STATUSES.ARCHIVED) {
    throw new AppError('An archived course cannot be edited', 409, 'COURSE_ARCHIVED');
  }
  if (input.categoryId) await assertActiveCategory(input.categoryId);
  if (input.title && input.title !== course.title) {
    course.title = input.title;
    course.slug = await uniqueCourseSlug(input.title, courseId);
  }
  if (input.categoryId !== undefined) course.categoryId = new Types.ObjectId(input.categoryId);
  if (input.shortDescription !== undefined) course.shortDescription = input.shortDescription;
  if (input.description !== undefined) course.description = input.description;
  if (input.level !== undefined) course.level = input.level;
  if (input.language !== undefined) course.language = input.language;
  if (input.requirements !== undefined) course.requirements = input.requirements;
  if (input.learningOutcomes !== undefined) course.learningOutcomes = input.learningOutcomes;
  if (input.targetAudience !== undefined) course.targetAudience = input.targetAudience;
  await course.save();
  return getInstructorCourse(instructorId, courseId);
};

export const replaceCourseThumbnail = async (
  instructorId: string,
  courseId: string,
  file: Express.Multer.File,
) => {
  const course = await getOwnedCourseOrThrow(courseId, instructorId, true);
  const oldPublicId = course.thumbnailPublicId;
  const uploaded = await uploadAssetBuffer({
    buffer: file.buffer,
    ownerId: courseId,
    folder: 'course-thumbnails',
    resourceType: 'image',
    originalFilename: file.originalname,
    transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
  });
  try {
    course.thumbnailUrl = uploaded.url;
    course.thumbnailPublicId = uploaded.publicId;
    await course.save();
  } catch (error) {
    await deleteStoredAsset(uploaded.publicId, 'image');
    throw error;
  }
  await deleteStoredAsset(oldPublicId, 'image');
  return getInstructorCourse(instructorId, courseId);
};

export const removeCourseThumbnail = async (instructorId: string, courseId: string) => {
  const course = await getOwnedCourseOrThrow(courseId, instructorId, true);
  const oldPublicId = course.thumbnailPublicId;
  course.thumbnailUrl = undefined;
  course.thumbnailPublicId = undefined;
  await course.save();
  await deleteStoredAsset(oldPublicId, 'image');
  return getInstructorCourse(instructorId, courseId);
};

export const publishCourse = async (instructorId: string, courseId: string) => {
  const course = await getOwnedCourseOrThrow(courseId, instructorId);
  if (course.status === COURSE_STATUSES.ARCHIVED) {
    throw new AppError('An archived course cannot be published', 409, 'COURSE_ARCHIVED');
  }
  if (course.status === COURSE_STATUSES.PUBLISHED) {
    return getInstructorCourse(instructorId, courseId);
  }
  await assertActiveCategory(course.categoryId.toString());
  const publishedSectionIds = await CourseSection.find({ courseId, isPublished: true }).distinct('_id');
  const publishedLessonExists = publishedSectionIds.length > 0
    ? await Lesson.exists({ courseId, sectionId: { $in: publishedSectionIds }, isPublished: true })
    : false;
  if (!publishedLessonExists) {
    throw new AppError(
      'Add and publish at least one lesson before publishing the course',
      409,
      'PUBLISHED_LESSON_REQUIRED',
    );
  }
  course.status = COURSE_STATUSES.PUBLISHED;
  course.publishedAt = new Date();
  course.archivedAt = undefined;
  await course.save();
  return getInstructorCourse(instructorId, courseId);
};

export const archiveCourse = async (instructorId: string, courseId: string) => {
  const course = await getOwnedCourseOrThrow(courseId, instructorId);
  course.status = COURSE_STATUSES.ARCHIVED;
  course.archivedAt = new Date();
  await course.save();
  return getInstructorCourse(instructorId, courseId);
};

export const archiveCourseForAdmin = async (courseId: string) => {
  const course = await getCourseOrThrow(courseId);
  course.status = COURSE_STATUSES.ARCHIVED;
  course.archivedAt = new Date();
  await course.save();
  return normalizeMongo(await populateCourseQuery(Course.findById(courseId)).lean());
};

export const listCoursesForAdmin = async (query: ListAdminCoursesQuery) => {
  const filter: QueryFilter<ICourse> = {};
  if (query.status) filter.status = query.status;
  if (query.instructorId) filter.instructorId = query.instructorId;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
    ];
  }
  const pagination = getPagination(query);
  const [courses, totalItems] = await Promise.all([
    populateCourseQuery(Course.find(filter)).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Course.countDocuments(filter),
  ]);
  return {
    courses: normalizeMongo(courses),
    pagination: createPaginationMetadata(query.page, query.limit, totalItems),
  };
};
