const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const include = {
  billing: {
    include: {
      tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
      lease: {
        select: {
          id: true,
          rentAmount: true,
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              building: { select: { id: true, name: true, address: true } },
            },
          },
        },
      },
    },
  },
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'status']) || { createdAt: 'desc' };
  const where = { ...orgFilter, deletedAt: null };

  if (query.status) where.status = query.status;
  if (query.billingId) where.billingId = query.billingId;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

  if (user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id } });
    if (tenant) {
      where.billing = { tenantId: tenant.id };
    }
  }

  const [data, total] = await Promise.all([
    prisma.payment.findMany({ where, skip, take, orderBy, include }),
    prisma.payment.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter) => {
  const item = await prisma.payment.findFirst({ where: { id, ...orgFilter, deletedAt: null }, include });
  if (!item) throw new AppError('Payment not found.', 404, 'NOT_FOUND');
  return item;
};

const create = async (data, organizationId) => {
  const { billingId, amount, paymentMethod } = data;

  const billing = await prisma.billing.findFirst({ where: { id: billingId, deletedAt: null } });
  if (!billing) throw new AppError('Billing record not found.', 404, 'NOT_FOUND');
  if (billing.status === 'paid') throw new AppError('This billing is already paid.', 409, 'CONFLICT');

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: { billingId, amount, paymentMethod, status: 'completed', organizationId },
      include,
    });
    await tx.billing.update({ where: { id: billingId }, data: { status: 'paid' } });
    return p;
  });

  return payment;
};

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.payment.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
    },
    include,
  });
};

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.payment.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };
