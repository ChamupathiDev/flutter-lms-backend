import type { QueryFilter } from 'mongoose';
import { AppError } from '../errors/AppError';
import { Course } from '../models/course.model';
import { CourseCategory, type ICourseCategory } from '../models/courseCategory.model';
import { createPaginationMetadata, getPagination } from '../utils/pagination';
import { toSlug } from '../utils/slug';
import { escapeRegex } from '../utils/escapeRegex';
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from '../validators/category.validator';

const uniqueCategorySlug = async (name: string, excludeId?: string) => {
  const base = toSlug(name) || 'category';
  let slug = base;
  let counter = 1;
  while (await CourseCategory.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return slug;
};

export const createCategory = async (adminId: string, input: CreateCategoryInput) => {
  if (await CourseCategory.exists({ name: { $regex: `^${escapeRegex(input.name)}$`, $options: 'i' } })) {
    throw new AppError('A category with this name already exists', 409, 'CATEGORY_NAME_EXISTS');
  }
  return CourseCategory.create({
    ...input,
    slug: await uniqueCategorySlug(input.name),
    createdBy: adminId,
  });
};

export const listCategories = async (query: ListCategoriesQuery) => {
  const filter: QueryFilter<ICourseCategory> = {};
  if (query.activeOnly) filter.isActive = true;
  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const pagination = getPagination(query);
  const [categories, totalItems] = await Promise.all([
    CourseCategory.find(filter).sort({ name: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    CourseCategory.countDocuments(filter),
  ]);
  return { categories, pagination: createPaginationMetadata(query.page, query.limit, totalItems) };
};

export const getCategory = async (categoryId: string) => {
  const category = await CourseCategory.findById(categoryId);
  if (!category) throw new AppError('Course category not found', 404, 'CATEGORY_NOT_FOUND');
  return category;
};

export const updateCategory = async (categoryId: string, input: UpdateCategoryInput) => {
  const category = await getCategory(categoryId);
  if (input.name && input.name.toLowerCase() !== category.name.toLowerCase()) {
    if (await CourseCategory.exists({ _id: { $ne: categoryId }, name: { $regex: `^${escapeRegex(input.name)}$`, $options: 'i' } })) {
      throw new AppError('A category with this name already exists', 409, 'CATEGORY_NAME_EXISTS');
    }
    category.name = input.name;
    category.slug = await uniqueCategorySlug(input.name, categoryId);
  }
  if (input.description !== undefined) category.description = input.description;
  await category.save();
  return category;
};

export const updateCategoryStatus = async (categoryId: string, input: UpdateCategoryStatusInput) => {
  const category = await getCategory(categoryId);
  if (!input.isActive && await Course.exists({ categoryId, status: 'PUBLISHED' })) {
    throw new AppError(
      'A category containing published courses cannot be deactivated',
      409,
      'CATEGORY_HAS_PUBLISHED_COURSES',
    );
  }
  category.isActive = input.isActive;
  await category.save();
  return category;
};
