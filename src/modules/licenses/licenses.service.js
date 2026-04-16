const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const list = async (query) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'expiresAt']) || { createdAt: 'desc' };
  const where = { deletedAt: null };
  if (query.organizationId) where.organizationId = query.organizationId;
  const [data, total] = await Promise.all([
    prisma.license.findMany({ where, skip, take, orderBy, include: { organization: true, subscription: true } }),
    prisma.license.count({ where })
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id) => {
  const lic = await prisma.license.findFirst({ where: { id, deletedAt: null } });
  if (!lic) throw new AppError('License not found.', 404, 'NOT_FOUND');
  return lic;
};

const create = async (data) => prisma.license.create({ data });

const update = async (id, data) => {
  await getById(id);
  return prisma.license.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.license.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };

