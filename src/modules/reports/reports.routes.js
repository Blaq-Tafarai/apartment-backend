const express = require('express');
const router = express.Router();
const ctrl = require('./reports.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytics and reporting endpoints
 */

router.use(authenticate, scopeOrganization, managerOrAbove);

/**
 * @swagger
 * /api/v1/reports/occupancy:
 *   get:
 *     summary: Occupancy report per building
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occupancy breakdown per building
 */
router.get('/occupancy', ctrl.occupancy);

/**
 * @swagger
 * /api/v1/reports/revenue:
 *   get:
 *     summary: Revenue report for a given month
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *     responses:
 *       200:
 *         description: Total revenue and breakdown by payment method
 */
router.get('/revenue', ctrl.revenue);

/**
 * @swagger
 * /api/v1/reports/expenses:
 *   get:
 *     summary: Expense report for a given month
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Expense breakdown by building and category
 */
router.get('/expenses', ctrl.expenses);

/**
 * @swagger
 * /api/v1/reports/maintenance:
 *   get:
 *     summary: Maintenance request status summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance count by status
 */
router.get('/maintenance', ctrl.maintenance);

/**
 * @swagger
 * /api/v1/reports/lease-expiry:
 *   get:
 *     summary: Leases expiring within N days
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: List of expiring leases
 */
router.get('/lease-expiry', ctrl.leaseExpiry);

/**
 * @swagger
 * /api/v1/reports/payment-summary:
 *   get:
 *     summary: Payment collection summary for a given month
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Billing status summary (paid vs overdue vs pending)
 */
router.get('/payment-summary', ctrl.paymentSummary);

module.exports = router;