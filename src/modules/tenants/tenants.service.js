/**
 * src/modules/tenants/tenants.service.js
 *
 * All email sending is done via BullMQ queue — never directly.
 */

const prisma = require('../../database/prisma/client');
const { AppError }          = require('../../middleware/error.middleware');
const { hashPassword }      = require('../../utils/password');
const { generatePassword }  = require('../../utils/generatePassword');
const { addCredentialsJob } = require('../../queues/email.queue');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');
const logger = require('../../config/logger');

const USER_SELECT = {
  id: true, name: true, email: true, status: true, mustChangePassword: true,
};

// ─── List ─────────────────────────────────────────────────────────────────────

const list = async (query, orgFilter) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt']) || { createdAt: 'desc' };
  const where   = { ...orgFilter, deletedAt: null };
  if (query.apartmentId) where.apartmentId = query.apartmentId;

  const [data, total] = await Promise.all([
    prisma.tenant.findMany({
      where, skip, take, orderBy,
      include: {
        user:      { select: USER_SELECT },
        apartment: { select: { id: true, unitNumber: true } },
      },
    }),
    prisma.tenant.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

// ─── Get by ID ────────────────────────────────────────────────────────────────

const getById = async (id, orgFilter) => {
  const item = await prisma.tenant.findFirst({
    where: { id, ...orgFilter, deletedAt: null },
    include: {
      user:      { select: USER_SELECT },
      apartment: { select: { id: true, unitNumber: true, buildingId: true } },
      leases:    { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!item) throw new AppError('Tenant not found.', 404, 'NOT_FOUND');
  return item;
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates a user (role: tenant) + tenant record in a single transaction.
 * - Auto-generates a secure temporary password
 * - Hashes it before saving — plain password never touches the DB
 * - Enqueues a credentials email via BullMQ (retried automatically on failure)
 * - Sets mustChangePassword = true
 * - NEVER accepts a password from the request body
 */
const create = async (data, organizationId) => {
  const { name, email, apartmentId } = data;

  const existingUser = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existingUser) throw new AppError('A user with this email already exists.', 409, 'CONFLICT');

  const plainPassword = generatePassword(12);
  const hashed        = await hashPassword(plainPassword);

  const tenant = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, password: hashed, role: 'tenant', organizationId, mustChangePassword: true },
    });
    return tx.tenant.create({
      data: { userId: user.id, apartmentId: apartmentId || null, organizationId },
      include: { user: { select: { id: true, name: true, email: true, mustChangePassword: true } } },
    });
  });

  // Enqueue credentials email — non-blocking, auto-retried by worker
  await addCredentialsJob({ to: email, name, role: 'tenant', password: plainPassword });
  logger.info({ tenantId: tenant.id }, 'Tenant created — credentials email queued');

  return tenant;
};

// ─── Update ───────────────────────────────────────────────────────────────────

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.tenant.update({
    where: { id },
    data: { apartmentId: data.apartmentId ?? undefined },
    include: { user: { select: { id: true, name: true, email: true, mustChangePassword: true } } },
  });
};

// ─── Delete (soft) ────────────────────────────────────────────────────────────

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };