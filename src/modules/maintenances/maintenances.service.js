const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const include = {
  apartment: { select: { id: true, unitNumber: true, buildingId: true } },
  tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
  assignedManager: { select: { id: true, name: true, email: true } },
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'status']) || { createdAt: 'desc' };
  const where = { ...orgFilter, deletedAt: null };

  if (query.status) where.status = query.status;
  if (query.apartmentId) where.apartmentId = query.apartmentId;
  if (query.assignedManagerId) where.assignedManagerId = query.assignedManagerId;

  // Tenant sees only their own requests
  if (user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id } });
    if (tenant) where.tenantId = tenant.id;
  }

  // Manager sees only requests in their assigned buildings
  if (user?.role === 'manager') {
    const managerBuildings = await prisma.managerBuilding.findMany({
      where: { managerId: user.id },
      select: { buildingId: true },
    });
    const buildingIds = managerBuildings.map((mb) => mb.buildingId);
    where.apartment = { buildingId: { in: buildingIds } };
  }

  const [data, total] = await Promise.all([
    prisma.maintenance.findMany({ where, skip, take, orderBy, include }),
    prisma.maintenance.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter) => {
  // Validate UUID format (standard UUIDv4 regex)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new AppError('Invalid maintenance request ID format.', 400, 'INVALID_ID');
  }

  const where = { id, ...orgFilter, deletedAt: null };

  // Log for debugging (remove in production if needed)
  console.log('Maintenance getById query:', { id, orgFilterKeys: Object.keys(orgFilter || {}) });

  const item = await prisma.maintenance.findFirst({
    where,
    include,
  });
  if (!item) {
    console.log('Maintenance not found with criteria:', where); // Debug log
    throw new AppError('Maintenance request not found.', 404, 'NOT_FOUND');
  }
  return item;
};

const create = async (data, organizationId, user) => {
  const { apartmentId, description, assignedManagerId, category, priority } = data;

  let tenantId = data.tenantId || null;

  // If created by a tenant, auto-resolve tenantId
  if (user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id } });
    if (tenant) tenantId = tenant.id;
  }

  return prisma.maintenance.create({
    data: {
      apartmentId,
      tenantId,
      assignedManagerId: assignedManagerId || null,
      category: category || 'other',
      priority: priority || 'low',
      description,
      status: 'open',
      organizationId,
    },
    include,
  });
};

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
  let { status, description, assignedManagerId, category, priority, completedAt, estimatedCost, actualCost, note } = data;
  if (completedAt) {
    status = 'resolved';
  }
  return prisma.maintenance.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(description && { description }),
      ...(assignedManagerId !== undefined && { assignedManagerId }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(completedAt && { completedAt: new Date(completedAt) }),
      ...(estimatedCost !== undefined && { estimatedCost }),
      ...(actualCost !== undefined && { actualCost }),
      ...(note !== undefined && { note }),
    },
    include,
  });
};

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.maintenance.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };