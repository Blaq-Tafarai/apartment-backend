const auditLogService = require('../modules/audit-logs/audit-logs.service');

/**
 * Maps HTTP method + route pattern to an AuditAction enum value.
 */
const methodToAction = (method) => {
  switch (method.toUpperCase()) {
    case 'POST':   return 'create';
    case 'PUT':
    case 'PATCH':  return 'update';
    case 'DELETE': return 'delete';
    default:       return null; // GET — don't log reads
  }
};

/**
 * Extracts the entity name from the base path segment.
 * e.g. "/api/v1/apartments/123" → "apartments"
 *      "/api/v1/users/abc/buildings" → "users"
 */
const extractEntity = (path) => {
  const match = path.match(/\/api\/v1\/([^/]+)/);
  return match ? match[1] : 'unknown';
};

/**
 * Extracts the primary resource ID from the URL path params.
 * Uses :id if present, otherwise the first UUID-shaped segment.
 */
const extractEntityId = (params) => {
  if (params.id) return params.id;
  const uuidParam = Object.values(params).find((v) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
  return uuidParam || null;
};

/**
 * Automatic audit log middleware for all mutating requests (POST, PUT, PATCH, DELETE).
 *
 * Usage: mount globally in app.js AFTER authenticate, or per-router.
 *
 * Logs are written asynchronously and NEVER block or fail the request.
 */
const auditLog = (req, res, next) => {
  const action = methodToAction(req.method);

  // Only log mutating operations — skip GET, HEAD, OPTIONS
  if (!action) return next();

  // Skip auth endpoints (login/logout handled separately) and health checks
  const skipPaths = ['/api/v1/auth/', '/health', '/api/v1/docs'];
  if (skipPaths.some((p) => req.path.startsWith(p))) return next();

  // Intercept the response so we know the final status code
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Only log successful mutations (2xx responses)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const userId = req.user?.id || null;
      const organizationId = req.user?.organizationId || req.organizationId || null;
      const entity = extractEntity(req.originalUrl || req.path);
      const entityId = extractEntityId(req.params) || body?.data?.id || null;

      // Determine what changed — include request body but strip sensitive fields
      const { password, otp, refreshToken, resetToken, ...safeBody } = req.body || {};
      const changes = Object.keys(safeBody).length > 0 ? safeBody : null;

      auditLogService
        .log({
          userId,
          organizationId,
          action,
          entity,
          entityId,
          changes,
          ipAddress: req.ip || req.connection?.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
        })
        .catch(() => {}); // silent — audit log failure must never affect the response
    }

    return originalJson(body);
  };

  next();
};

/**
 * Explicit login/logout audit logger — call from auth service directly
 * since those don't go through the general mutating-request path.
 */
const logAuthEvent = (action, userId, organizationId, req) => {
  auditLogService
    .log({
      userId,
      organizationId,
      action,
      entity: 'auth',
      entityId: userId,
      changes: null,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
    })
    .catch(() => {});
};

module.exports = { auditLog, logAuthEvent };