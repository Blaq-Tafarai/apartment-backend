const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const getManagerBuildingIds = async (managerId) => {
  const assignments = await prisma.managerBuilding.findMany({ where: { managerId }, select: { buildingId: true } });
  return assignments.map((a) => a.buildingId);
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['unitNumber', 'status', 'createdAt']) || { createdAt: 'desc' };

  const where = { deletedAt: null, ...orgFilter };
  if (query.buildingId) where.buildingId = query.buildingId;
  if (query.status) where.status = query.status;
  if (query.search) where.unitNumber = { contains: query.search, mode: 'insensitive' };

  if (user.role === 'manager') {
    const buildingIds = await getManagerBuildingIds(user.id);
    where.buildingId = { in: buildingIds };
  }

  if (user.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id, deletedAt: null } });
    if (tenant?.apartmentId) where.id = tenant.apartmentId;
    else return buildPaginatedResponse([], 0, 1, 10);
  }

  const [data, total] = await Promise.all([
    prisma.apartment.findMany({
      where,
      skip,
      take,
      orderBy,
      include: { building: { select: { id: true, name: true } } },
    }),
    prisma.apartment.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter, user) => {
  const where = { id, deletedAt: null, ...orgFilter };

  if (user?.role === 'manager') {
    const buildingIds = await getManagerBuildingIds(user.id);
    where.buildingId = { in: buildingIds };
  }

  const apt = await prisma.apartment.findFirst({
    where,
    include: {
      building: true,
      tenants: { where: { deletedAt: null }, include: { user: { select: { id: true, name: true, email: true } } } },
      leases: { where: { deletedAt: null, status: 'active' } },
    },
  });
  if (!apt) throw new AppError('Apartment not found.', 404, 'NOT_FOUND');
  return apt;
};

const create = async (data, organizationId) => {
  const building = await prisma.building.findFirst({ where: { id: data.buildingId, deletedAt: null, organizationId } });
  if (!building) throw new AppError('Building not found.', 404, 'NOT_FOUND');
  return prisma.apartment.create({ data: { ...data, organizationId } });
};

const update = async (id, data, orgFilter) => {
  const apt = await prisma.apartment.findFirst({ where: { id, deletedAt: null, ...orgFilter } });
  if (!apt) throw new AppError('Apartment not found.', 404, 'NOT_FOUND');
  
  // Handle building relation update
  if (data.buildingId) {
    const building = await prisma.building.findFirst({ where: { id: data.buildingId, deletedAt: null, organizationId: orgFilter.organizationId } });
    if (!building) throw new AppError('Building not found.', 404, 'NOT_FOUND');
    data.building = { connect: { id: data.buildingId } };
    delete data.buildingId;
  }
  
  return prisma.apartment.update({ where: { id }, data });
};

const remove = async (id, orgFilter) => {
  const apt = await prisma.apartment.findFirst({ where: { id, deletedAt: null, ...orgFilter } });
  if (!apt) throw new AppError('Apartment not found.', 404, 'NOT_FOUND');
  return prisma.apartment.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };