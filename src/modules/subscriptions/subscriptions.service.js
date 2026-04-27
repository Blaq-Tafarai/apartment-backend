const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const list = async (query) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'status', 'planName']) || { createdAt: 'desc' };
  const where = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.organizationId) where.organizationId = query.organizationId;

  const [data, total] = await Promise.all([
    prisma.subscription.findMany({ where, skip, take, orderBy, include: { organization: { select: { id: true, name: true } } } }),
    prisma.subscription.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id) => {
  const sub = await prisma.subscription.findFirst({ where: { id, deletedAt: null }, include: { licenses: true } });
  if (!sub) throw new AppError('Subscription not found.', 404, 'NOT_FOUND');
  return sub;
};

const create = async (data) => {
  const subscription = await prisma.subscription.create({ data });
  await prisma.organization.update({
    where: { id: data.organizationId },
    data: { subscriptionId: subscription.id },
  });
  return subscription;
};

const update = async (id, data) => {
  await getById(id);
  return prisma.subscription.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.subscription.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };