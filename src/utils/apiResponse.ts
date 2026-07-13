export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
}

export const createSuccessResponse = <T>(
  message: string,
  data: T,
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
});