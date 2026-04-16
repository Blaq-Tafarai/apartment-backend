/**
 * src/modules/users/users.service.js
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

const SAFE_SELECT = {
  id: true, name: true, email: true, phone: true, role: true,
  status: true, mustChangePassword: true,
  createdAt: true, updatedAt: true,
  organization: {
    select: {
      id: true,
      name: true,
      phone: true
    }
  }
};

// ─── List ─────────────────────────────────────────────────────────────────────

const list = async (query, orgFilter) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['name', 'email', 'createdAt', 'role']) || { createdAt: 'desc' };

  const where = { deletedAt: null, ...orgFilter };
  if (query.role)   where.role = query.role;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { name:  { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy, select: SAFE_SELECT }),
    prisma.user.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

// ─── Get by ID ────────────────────────────────────────────────────────────────

const getById = async (id, orgFilter) => {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null, ...orgFilter }, select: SAFE_SELECT });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  return user;
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates a new user.
 * - Auto-generates a cryptographically secure temporary password
 * - Hashes it before saving — plain password never touches the DB
 * - Enqueues a credentials email via BullMQ (retried automatically on failure)
 * - Sets mustChangePassword = true so user is forced to change on first login
 * - NEVER accepts a password from the request body
 */
const create = async (data, organizationId) => {
const { name, email, phone, role } = data;

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) throw new AppError('Email already in use.', 409, 'CONFLICT');

  const plainPassword = generatePassword(12);
  const hashed        = await hashPassword(plainPassword);

  const user = await prisma.user.create({
    data: {
      name, email, ...(phone && { phone }), password: hashed,
      role: role || 'tenant',
      organizationId: data.organizationId || organizationId,
      mustChangePassword: true,
    },
    select: SAFE_SELECT,
  });

  // Enqueue credentials email — non-blocking, auto-retried by worker
  await addCredentialsJob({ to: email, name, role: user.role, password: plainPassword });
  logger.info({ userId: user.id, role: user.role }, 'User created — credentials email queued');

  return user;
};

// ─── Update ───────────────────────────────────────────────────────────────────

const update = async (id, data, orgFilter) => {
  await getById(id, orgFilter);
const { name, phone, role, status } = data;
  return prisma.user.update({
    where: { id },
    data: {
      ...(name   && { name }),
      ...(phone && { phone }),
      ...(role   && { role }),
      ...(status && { status }),
    },
    select: SAFE_SELECT,
  });
};

// ─── Delete (soft) ────────────────────────────────────────────────────────────

const remove = async (id, orgFilter) => {
  await getById(id, orgFilter);
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
};

// ─── Reset Password (admin-initiated) ────────────────────────────────────────

/**
 * Admin resets a user's password.
 * - Generates a new temporary password
 * - Hashes it
 * - Enqueues a credentials email via BullMQ
 * - Sets mustChangePassword = true
 * - Invalidates all existing sessions
 */
const resetPassword = async (id, orgFilter) => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null, ...orgFilter },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const plainPassword = generatePassword(12);
  const hashed        = await hashPassword(plainPassword);

  await prisma.user.update({
    where: { id },
    data: { password: hashed, mustChangePassword: true, refreshToken: null },
  });

  await addCredentialsJob({ to: user.email, name: user.name, role: user.role, password: plainPassword });
  logger.info({ userId: id }, 'Password reset — new credentials email queued');

  return { message: "Password reset. New credentials sent to user's email." };
};

// ─── Building assignment ──────────────────────────────────────────────────────

const assignBuilding = async (managerId, buildingId, orgFilter) => {
  const manager = await prisma.user.findFirst({ where: { id: managerId, role: 'manager', deletedAt: null, ...orgFilter } });
  if (!manager) throw new AppError('Manager not found.', 404, 'NOT_FOUND');

  const building = await prisma.building.findFirst({ where: { id: buildingId, deletedAt: null, ...orgFilter } });
  if (!building) throw new AppError('Building not found.', 404, 'NOT_FOUND');

  return prisma.managerBuilding.upsert({
    where: { managerId_buildingId: { managerId, buildingId } },
    update: {},
    create: { managerId, buildingId },
  });
};

const unassignBuilding = async (managerId, buildingId) =>
  prisma.managerBuilding.deleteMany({ where: { managerId, buildingId } });

const getManagerBuildings = async (managerId) =>
  prisma.managerBuilding.findMany({ where: { managerId }, include: { building: true } });

module.exports = {
  list, getById, create, update, remove,
  resetPassword,
  assignBuilding, unassignBuilding, getManagerBuildings,
};