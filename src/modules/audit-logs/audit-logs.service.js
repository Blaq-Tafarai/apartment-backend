const prisma = require('../../database/prisma/client');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

/**
 * Write an audit log entry.
 */
const log = async ({ userId, organizationId, action, entity, entityId, changes, ipAddress, userAgent }) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        organizationId: organizationId || null,
        action,
        entity,
        entityId: entityId || null,
        changes: changes || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch {
    // Never throw from audit logging
    return null;
  }
};

const list = async (query, orgFilter) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt']) || { createdAt: 'desc' };
  const where = { ...orgFilter };

  if (query.action) where.action = query.action;
  if (query.entity) where.entity = query.entity;
  if (query.userId) where.userId = query.userId;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take, orderBy,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id) => {
  return prisma.auditLog.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

module.exports = { log, list, getById };