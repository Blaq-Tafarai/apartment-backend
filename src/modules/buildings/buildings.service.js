const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['name', 'createdAt']) || { createdAt: 'desc' };

  const where = { deletedAt: null, ...orgFilter };

  // Managers only see their assigned buildings
  if (user.role === 'manager') {
    where.managers = { some: { managerId: user.id } };
  }

  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

  const [data, total] = await Promise.all([
    prisma.building.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: { select: { apartments: true } },
        managers: { include: { manager: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.building.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter, user) => {
  const where = { id, deletedAt: null, ...orgFilter };
  if (user?.role === 'manager') where.managers = { some: { managerId: user.id } };

  const building = await prisma.building.findFirst({
    where,
    include: {
      apartments: { where: { deletedAt: null }, select: { id: true, unitNumber: true, status: true } },
      managers: { include: { manager: { select: { id: true, name: true, email: true } } } },
      _count: { select: { apartments: true, expenses: true } },
    },
  });
  if (!building) throw new AppError('Building not found.', 404, 'NOT_FOUND');
  return building;
};

const create = async (data, organizationId) => {
  return prisma.building.create({ data: { ...data, organizationId } });
};

const update = async (id, data, orgFilter) => {
  const building = await prisma.building.findFirst({ where: { id, deletedAt: null, ...orgFilter } });
  if (!building) throw new AppError('Building not found.', 404, 'NOT_FOUND');
  return prisma.building.update({ where: { id }, data });
};

const remove = async (id, orgFilter) => {
  const building = await prisma.building.findFirst({ where: { id, deletedAt: null, ...orgFilter } });
  if (!building) throw new AppError('Building not found.', 404, 'NOT_FOUND');
  return prisma.building.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };