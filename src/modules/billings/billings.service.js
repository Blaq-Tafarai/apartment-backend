const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const include = {
  tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
  lease: { select: { id: true, rentAmount: true, status: true } },
  payments: { where: { deletedAt: null } },
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'dueDate', 'status']) || { createdAt: 'desc' };
  const where = { ...orgFilter, deletedAt: null };

  if (query.status) where.status = query.status;
  if (query.tenantId) where.tenantId = query.tenantId;
  if (query.leaseId) where.leaseId = query.leaseId;

  if (user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id } });
    if (tenant) where.tenantId = tenant.id;
  }

  const [data, total] = await Promise.all([
    prisma.billing.findMany({ where, skip, take, orderBy, include }),
    prisma.billing.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter) => {
  const item = await prisma.billing.findFirst({ where: { id, ...orgFilter, deletedAt: null }, include });
  if (!item) throw new AppError('Billing record not found.', 404, 'NOT_FOUND');
  return item;
};

const create = async (data, organizationId) => {
  const { tenantId, leaseId, amount, dueDate } = data;
  return prisma.billing.create({
    data: { tenantId, leaseId, amount, dueDate: new Date(dueDate), status: data.status || 'pending', organizationId },
    include,
  });
};

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
  const { amount, dueDate, status } = data;
  return prisma.billing.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(status && { status }),
    },
    include,
  });
};

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.billing.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };