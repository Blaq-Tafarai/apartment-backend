const STATUSES = {
  USER: { ACTIVE: 'active', INACTIVE: 'inactive', SUSPENDED: 'suspended' },
  ORG: { ACTIVE: 'active', INACTIVE: 'inactive', SUSPENDED: 'suspended' },
  SUBSCRIPTION: { ACTIVE: 'active', INACTIVE: 'inactive', CANCELLED: 'cancelled', EXPIRED: 'expired' },
  APARTMENT: { AVAILABLE: 'available', OCCUPIED: 'occupied', UNDER_MAINTENANCE: 'under_maintenance', INACTIVE: 'inactive' },
  LEASE: { ACTIVE: 'active', EXPIRED: 'expired', TERMINATED: 'terminated', PENDING: 'pending' },
  BILLING: { PENDING: 'pending', PAID: 'paid', OVERDUE: 'overdue', CANCELLED: 'cancelled' },
  PAYMENT: { PENDING: 'pending', COMPLETED: 'completed', FAILED: 'failed', REFUNDED: 'refunded' },
  MAINTENANCE: { OPEN: 'open', IN_PROGRESS: 'in_progress', RESOLVED: 'resolved', CLOSED: 'closed' },
};

module.exports = STATUSES;