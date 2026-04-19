const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const include = {
  apartment: { select: { id: true, unitNumber: true, buildingId: true } },
  tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'startDate', 'endDate', 'status']) || { createdAt: 'desc' };
  const where = { ...orgFilter, deletedAt: null };

  if (query.status) where.status = query.status;
  if (query.tenantId) where.tenantId = query.tenantId;
  if (query.apartmentId) where.apartmentId = query.apartmentId;

  // Tenant can only see their own leases
  if (user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id, deletedAt: null } });
    if (tenant) where.tenantId = tenant.id;
  }

  const [data, total] = await Promise.all([
    prisma.lease.findMany({ where, skip, take, orderBy, include }),
    prisma.lease.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter) => {
  const item = await prisma.lease.findFirst({ where: { id, ...orgFilter, deletedAt: null }, include });
  if (!item) throw new AppError('Lease not found.', 404, 'NOT_FOUND');
  return item;
};

const create = async (data, organizationId) => {
  const { apartmentId, tenantId, startDate, endDate, rentAmount, securityDeposit, terms, status } = data;

  // Check for active lease on the apartment
  const existing = await prisma.lease.findFirst({
    where: { apartmentId, status: 'active', deletedAt: null },
  });
  if (existing) throw new AppError('This apartment already has an active lease.', 409, 'CONFLICT');

  const lease = await prisma.$transaction(async (tx) => {
    const l = await tx.lease.create({
      data: {
        apartmentId, tenantId, organizationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount,
        securityDeposit,
        terms,
        status: status || 'active',
      },
      include,
    });
    // Mark apartment as occupied
    await tx.apartment.update({ where: { id: apartmentId }, data: { status: 'occupied' } });
    return l;
  });

  return lease;
};

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
  const { startDate, endDate, rentAmount, status, securityDeposit, terms } = data;
  return prisma.lease.update({
    where: { id },
    data: {
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(rentAmount !== undefined && { rentAmount }),
      ...(status && { status }),
      ...(securityDeposit !== undefined && { securityDeposit }),
      ...(terms && { terms }),
    },
    include,
  });
};

const terminate = async (id, orgFilter) => {
  const lease = await getById(id, orgFilter);
  await prisma.$transaction(async (tx) => {
    await tx.lease.update({ where: { id }, data: { status: 'terminated' } });
    await tx.apartment.update({ where: { id: lease.apartmentId }, data: { status: 'available' } });
  });
};

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.lease.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, terminate, remove };