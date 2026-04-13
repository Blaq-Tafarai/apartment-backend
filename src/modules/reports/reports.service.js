const prisma = require('../../database/prisma/client');
const { startOfMonth, endOfMonth } = require('../../utils/date');

/**
 * Occupancy report: total / occupied / available apartments per building.
 */
const occupancyReport = async (orgFilter) => {
  const buildings = await prisma.building.findMany({
    where: { ...orgFilter, deletedAt: null },
    include: {
      apartments: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  return buildings.map((b) => ({
    buildingId: b.id,
    buildingName: b.name,
    total: b.apartments.length,
    occupied: b.apartments.filter((a) => a.status === 'occupied').length,
    available: b.apartments.filter((a) => a.status === 'available').length,
    underMaintenance: b.apartments.filter((a) => a.status === 'under_maintenance').length,
    occupancyRate:
      b.apartments.length > 0
        ? `${((b.apartments.filter((a) => a.status === 'occupied').length / b.apartments.length) * 100).toFixed(1)}%`
        : '0%',
  }));
};

/**
 * Revenue report: total payments collected for a given month.
 */
const revenueReport = async (orgFilter, year, month) => {
  const from = startOfMonth(new Date(year, month - 1));
  const to = endOfMonth(new Date(year, month - 1));

  const payments = await prisma.payment.groupBy({
    by: ['paymentMethod'],
    where: {
      ...orgFilter,
      status: 'completed',
      deletedAt: null,
      createdAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const total = await prisma.payment.aggregate({
    where: {
      ...orgFilter,
      status: 'completed',
      deletedAt: null,
      createdAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });

  return {
    period: { from, to, year, month },
    totalRevenue: total._sum.amount || 0,
    byMethod: payments,
  };
};

/**
 * Expense report: total expenses per building in a given month.
 */
const expenseReport = async (orgFilter, year, month) => {
  const from = startOfMonth(new Date(year, month - 1));
  const to = endOfMonth(new Date(year, month - 1));

  const expenses = await prisma.expense.groupBy({
    by: ['buildingId', 'category'],
    where: { ...orgFilter, deletedAt: null, createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: { id: true },
  });

  const total = await prisma.expense.aggregate({
    where: { ...orgFilter, deletedAt: null, createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  return {
    period: { from, to, year, month },
    totalExpenses: total._sum.amount || 0,
    breakdown: expenses,
  };
};

/**
 * Maintenance report: count by status.
 */
const maintenanceReport = async (orgFilter) => {
  const stats = await prisma.maintenance.groupBy({
    by: ['status'],
    where: { ...orgFilter, deletedAt: null },
    _count: { id: true },
  });

  return {
    summary: stats.map((s) => ({ status: s.status, count: s._count.id })),
  };
};

/**
 * Lease expiry report: leases expiring in the next N days.
 */
const leaseExpiryReport = async (orgFilter, days = 30) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const leases = await prisma.lease.findMany({
    where: {
      ...orgFilter,
      status: 'active',
      deletedAt: null,
      endDate: { gte: now, lte: future },
    },
    include: {
      tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
      apartment: { select: { id: true, unitNumber: true } },
    },
    orderBy: { endDate: 'asc' },
  });

  return { expiringIn: days, count: leases.length, leases };
};

/**
 * Payment summary: paid vs overdue billings.
 */
const paymentSummaryReport = async (orgFilter, year, month) => {
  const from = startOfMonth(new Date(year, month - 1));
  const to = endOfMonth(new Date(year, month - 1));

  const summary = await prisma.billing.groupBy({
    by: ['status'],
    where: { ...orgFilter, deletedAt: null, dueDate: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    period: { from, to, year, month },
    summary: summary.map((s) => ({ status: s.status, count: s._count.id, total: s._sum.amount })),
  };
};

module.exports = {
  occupancyReport,
  revenueReport,
  expenseReport,
  maintenanceReport,
  leaseExpiryReport,
  paymentSummaryReport,
};