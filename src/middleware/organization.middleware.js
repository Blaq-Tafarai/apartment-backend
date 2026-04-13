const { AppError } = require('./error.middleware');

/**
 * Scopes all queries to the authenticated user's organization.
 * Injects req.organizationId and req.orgFilter for use in services.
 * Superadmins are not scoped (they can access all orgs).
 */
const scopeOrganization = (req, res, next) => {
  try {
    if (!req.user) return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));

    if (req.user.role === 'superadmin') {
      // Superadmins can optionally filter by orgId via query param
      req.organizationId = req.query.organizationId || null;
      req.orgFilter = req.organizationId ? { organizationId: req.organizationId } : {};
    } else {
      if (!req.user.organizationId) {
        return next(new AppError('User is not associated with an organization.', 403, 'FORBIDDEN'));
      }
      req.organizationId = req.user.organizationId;
      req.orgFilter = { organizationId: req.organizationId };
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { scopeOrganization };