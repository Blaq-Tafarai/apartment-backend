const ROLES = require('./roles');

/**
 * Defines which roles can perform CRUD operations on each module.
 * Format: { module: { action: [roles] } }
 */
const PERMISSIONS = {
  organizations: {
    create: [ROLES.SUPERADMIN],
    read: [ROLES.SUPERADMIN],
    update: [ROLES.SUPERADMIN],
    delete: [ROLES.SUPERADMIN],
  },
  subscriptions: {
    create: [ROLES.SUPERADMIN],
    read: [ROLES.SUPERADMIN],
    update: [ROLES.SUPERADMIN],
    delete: [ROLES.SUPERADMIN],
  },
  licenses: {
    create: [ROLES.SUPERADMIN],
    read: [ROLES.SUPERADMIN],
    update: [ROLES.SUPERADMIN],
    delete: [ROLES.SUPERADMIN],
  },
  users: {
    create: [ROLES.SUPERADMIN, ROLES.ADMIN],
    read: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.SUPERADMIN, ROLES.ADMIN],
    delete: [ROLES.SUPERADMIN, ROLES.ADMIN],
  },
  buildings: {
    create: [ROLES.ADMIN],
    read: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  apartments: {
    create: [ROLES.ADMIN, ROLES.MANAGER],
    read: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN, ROLES.MANAGER],
  },
  tenants: {
    create: [ROLES.ADMIN, ROLES.MANAGER],
    read: [ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN, ROLES.MANAGER],
  },
  leases: {
    create: [ROLES.ADMIN, ROLES.MANAGER],
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },
  billings: {
    create: [ROLES.ADMIN, ROLES.MANAGER],
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },
  payments: {
    create: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },
  maintenances: {
    create: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN, ROLES.MANAGER],
  },
  documents: {
    create: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TENANT],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN, ROLES.MANAGER],
  },
  expenses: {
    create: [ROLES.ADMIN, ROLES.MANAGER],
    read: [ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN, ROLES.MANAGER],
    delete: [ROLES.ADMIN],
  },
  reports: {
    create: [ROLES.ADMIN],
    read: [ROLES.ADMIN, ROLES.MANAGER],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  'audit-logs': {
    read: [ROLES.SUPERADMIN, ROLES.ADMIN],
  },
};

module.exports = PERMISSIONS;