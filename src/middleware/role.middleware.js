const { AppError } = require('./error.middleware');

/**
 * Restrict access to the given roles.
 * @param {...string} roles
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }
    return next();
  };

/**
 * Superadmin-only guard.
 */
const superadminOnly = authorize('superadmin');

/**
 * Admin or above guard.
 */
const adminOnly = authorize('superadmin', 'admin');

/**
 * Manager or above guard.
 */
const managerOrAbove = authorize('superadmin', 'admin', 'manager');

module.exports = { authorize, superadminOnly, adminOnly, managerOrAbove };