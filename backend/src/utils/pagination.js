function parsePagination(query = {}) {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function getPagination(page = 1, limit = 10) {
  return parsePagination({ page, limit });
}

function getPaginationMetadata(
  totalItems,
  page,
  limit
) {
  const totalPages = Math.ceil(
    totalItems / limit
  );

  return {
    currentPage: page,
    pageSize: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

module.exports = {
  parsePagination,
  getPagination,
  getPaginationMetadata,
};