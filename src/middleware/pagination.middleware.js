const { getPaginationArgs, getOrderByArgs } = require('../utils/pagination');

/**
 * Parses page, limit, sortBy, sortOrder from query and attaches to req.
 */
const paginate = (allowedSortFields = []) =>
  (req, res, next) => {
    const { skip, take, page, limit } = getPaginationArgs(req.query);
    req.pagination = { skip, take, page, limit };
    req.orderBy = getOrderByArgs(req.query, allowedSortFields);
    next();
  };

module.exports = { paginate };