const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const include = {
  building: { select: { id: true, name: true, address: true } },
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'amount', 'category']) || { createdAt: 'desc' };
  const where = { ...orgFilter, deletedAt: null };

  if (query.category) where.category = query.category;
  if (query.buildingId) where.buildingId = query.buildingId;

  // Managers scoped to their buildings
  if (user?.role === 'manager') {
    const managerBuildings = await prisma.managerBuilding.findMany({
      where: { managerId: user.id },
      select: { buildingId: true },
    });
    const buildingIds = managerBuildings.map((mb) => mb.buildingId);
    where.buildingId = { in: buildingIds };
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({ where, skip, take, orderBy, include }),
    prisma.expense.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter) => {
  const item = await prisma.expense.findFirst({
    where: { id, ...orgFilter, deletedAt: null },
    include,
  });
  if (!item) throw new AppError('Expense not found.', 404, 'NOT_FOUND');
  return item;
};

const create = async (data, organizationId) => {
  const { buildingId, amount, category, description } = data;
  return prisma.expense.create({
    data: { buildingId, amount, category, description: description || null, organizationId },
    include,
  });
};

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
  const { amount, category, description } = data;
  return prisma.expense.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
    },
    include,
  });
};

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
};

const getSummaryByBuilding = async (buildingId, orgFilter) => {
  const expenses = await prisma.expense.groupBy({
    by: ['category'],
    where: { buildingId, ...orgFilter, deletedAt: null },
    _sum: { amount: true },
    _count: { id: true },
  });
  return expenses;
};

module.exports = { list, getById, create, update, remove, getSummaryByBuilding };