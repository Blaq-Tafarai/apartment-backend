const env = require('../config/env');

/**
 * Build Prisma pagination args from query params.
 */
const getPaginationArgs = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    env.MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit, 10) || env.DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

/**
 * Build a standardised paginated response.
 */
const buildPaginatedResponse = (data, total, page, limit) => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

/**
 * Build Prisma orderBy from query params.
 * e.g. ?sortBy=createdAt&sortOrder=desc
 */
const getOrderByArgs = (query, allowedFields = []) => {
  const { sortBy, sortOrder } = query;
  if (!sortBy || (allowedFields.length && !allowedFields.includes(sortBy))) return undefined;
  const direction = sortOrder === 'asc' ? 'asc' : 'desc';
  return { [sortBy]: direction };
};

module.exports = { getPaginationArgs, buildPaginatedResponse, getOrderByArgs };