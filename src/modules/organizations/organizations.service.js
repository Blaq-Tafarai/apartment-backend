const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const list = async (query) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['name', 'createdAt', 'status']) || { createdAt: 'desc' };

  const where = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

  const [data, total] = await Promise.all([
    prisma.organization.findMany({ where, skip, take, orderBy }),
    prisma.organization.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id) => {
  const org = await prisma.organization.findFirst({ where: { id, deletedAt: null } });
  if (!org) throw new AppError('Organization not found.', 404, 'NOT_FOUND');
  return org;
};

const create = async (data) => {
  return prisma.organization.create({ data });
};

const update = async (id, data) => {
  await getById(id);
  return prisma.organization.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.organization.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };