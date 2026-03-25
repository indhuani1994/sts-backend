const createListQuery = (req, allowedSortFields = []) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const skip = (page - 1) * limit;

  const search = (req.query.search || '').trim();
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sort = { [sortField]: sortOrder };

  return {
    page,
    limit,
    skip,
    search,
    sort,
    paginated: req.query.paginated === 'true',
  };
};

module.exports = { createListQuery };
