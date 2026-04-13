const express = require('express');
const router = express.Router();

// ─── Module Routes ───────────────────────────────────────────────────────────
const authRoutes         = require('../modules/auth/auth.routes');
const organizationRoutes = require('../modules/organizations/organizations.routes');
const subscriptionRoutes = require('../modules/subscriptions/subscriptions.routes');
const licenseRoutes      = require('../modules/licenses/licenses.routes');
const userRoutes         = require('../modules/users/users.routes');
const buildingRoutes     = require('../modules/buildings/buildings.routes');
const apartmentRoutes    = require('../modules/apartments/apartments.routes');
const tenantRoutes       = require('../modules/tenants/tenants.routes');
const leaseRoutes        = require('../modules/leases/leases.routes');
const billingRoutes      = require('../modules/billings/billings.routes');
const paymentRoutes      = require('../modules/payments/payments.routes');
const maintenanceRoutes  = require('../modules/maintenances/maintenances.routes');
const documentRoutes     = require('../modules/documents/documents.routes');
const expenseRoutes      = require('../modules/expenses/expenses.routes');
const invoiceRoutes      = require('../modules/invoices/invoices.routes');
const reportRoutes       = require('../modules/reports/reports.routes');
const auditLogRoutes     = require('../modules/audit-logs/audit-logs.routes');

// ─── Mount ───────────────────────────────────────────────────────────────────
router.use('/auth',          authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/licenses',      licenseRoutes);
router.use('/users',         userRoutes);
router.use('/buildings',     buildingRoutes);
router.use('/apartments',    apartmentRoutes);
router.use('/tenants',       tenantRoutes);
router.use('/leases',        leaseRoutes);
router.use('/billings',      billingRoutes);
router.use('/payments',      paymentRoutes);
router.use('/maintenances',  maintenanceRoutes);
router.use('/documents',     documentRoutes);
router.use('/expenses',      expenseRoutes);
router.use('/invoices',      invoiceRoutes);
router.use('/reports',       reportRoutes);
router.use('/audit-logs',    auditLogRoutes);

module.exports = router;