const { AppError } = require('./error.middleware');

/**
 * Blocks access to any route if the authenticated user still has
 * mustChangePassword = true (i.e. they haven't changed their temp password yet).
 *
 * Attach this AFTER `authenticate` on any router that should be protected.
 *
 * The only routes allowed through are:
 *   POST /api/v1/auth/logout
 *   PUT  /api/v1/auth/change-password
 *
 * These are whitelisted inside the auth router itself, so this middleware
 * is applied at the v1 router level for everything else.
 */
const requirePasswordChanged = (req, res, next) => {
  if (!req.user) return next(); // unauthenticated — auth middleware will catch it

  if (req.user.mustChangePassword) {
    return next(
      new AppError(
        'You must change your temporary password before accessing this resource. ' +
          'Please call PUT /api/v1/auth/change-password.',
        403,
        'PASSWORD_CHANGE_REQUIRED'
      )
    );
  }

  return next();
};

module.exports = { requirePasswordChanged };