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
  id: true, name: true, email: true, phone: true, gender: true, emergencyName: true, emergencyPhone: true, emergencyRelationship: true, status: true, mustChangePassword: true,
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
leases: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
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
      data: { 
        name, 
        email, 
        phone: data.phone, 
        gender: data.gender,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelationship: data.emergencyRelationship,
        password: hashed, 
        role: 'tenant', 
        organizationId, 
        mustChangePassword: true 
      },
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

/**
 * Full tenant update: User personal fields + Tenant apartment assignment
 * - Transaction ensures atomicity
 * - Only updates provided fields
 * - No password/email changes (use dedicated endpoints)
 */
const update = async (id, data, orgFilter) => {
  const tenant = await getById(id, orgFilter);
  
  // User personal data (only provided fields)
  const userData = {
    ...(data.name && { name: data.name }),
    ...(data.phone && { phone: data.phone }),
    ...(data.gender && { gender: data.gender }),
    ...(data.emergencyName && { emergencyName: data.emergencyName }),
    ...(data.emergencyPhone && { emergencyPhone: data.emergencyPhone }),
    ...(data.emergencyRelationship && { emergencyRelationship: data.emergencyRelationship }),
  };
  
  // Tenant apartment
  const tenantData = data.apartmentId ? { apartmentId: data.apartmentId } : {};
  
  // Require at least one field
  if (Object.keys(userData).length === 0 && Object.keys(tenantData).length === 0) {
    throw new AppError('No valid fields provided for update.', 400, 'INVALID_REQUEST');
  }
  
  return prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: tenant.userId },
        data: userData,
      });
    }
    
    return tx.tenant.update({
      where: { id },
      data: tenantData,
      include: {
        user: { select: USER_SELECT },
        apartment: { select: { id: true, unitNumber: true, buildingId: true } },
        leases: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  });
};

// ─── Delete (soft) ────────────────────────────────────────────────────────────

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, create, update, remove };

