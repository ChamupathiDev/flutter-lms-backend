import type { RequestHandler } from 'express';
import { getAdminDashboard, getInstructorDashboard, getStudentDashboard } from '../services/dashboard.service';
import { createSuccessResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../utils/request';

export const getStudentDashboardSummary: RequestHandler = asyncHandler(async (request, response) => {
  const dashboard = await getStudentDashboard(requireAuth(request).userId);
  response.status(200).json(createSuccessResponse('Student dashboard retrieved successfully', { dashboard }));
});
export const getInstructorDashboardSummary: RequestHandler = asyncHandler(async (request, response) => {
  const dashboard = await getInstructorDashboard(requireAuth(request).userId);
  response.status(200).json(createSuccessResponse('Instructor dashboard retrieved successfully', { dashboard }));
});
export const getAdminDashboardSummary: RequestHandler = asyncHandler(async (_request, response) => {
  const dashboard = await getAdminDashboard();
  response.status(200).json(createSuccessResponse('Admin dashboard retrieved successfully', { dashboard }));
});
