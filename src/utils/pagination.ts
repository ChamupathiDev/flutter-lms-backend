export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const getPagination = ({
  page,
  limit,
}: PaginationInput): {
  skip: number;
  limit: number;
} => ({
  skip: (page - 1) * limit,
  limit,
});

export const createPaginationMetadata = (
  page: number,
  limit: number,
  totalItems: number,
): PaginationMetadata => {
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / limit),
  );

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage:
      page < totalPages,
    hasPreviousPage:
      page > 1,
  };
};