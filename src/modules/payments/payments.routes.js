const express = require('express');
const router = express.Router();
const ctrl = require('./payments.controller');
const { createRules, updateRules } = require('./payments.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: List payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, completed, failed, refunded] }
 *       - in: query
 *         name: billingId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: paymentMethod
 *         schema: { type: string, enum: [cash, bank_transfer, card, mobile_money, cheque] }
 *     responses:
 *       200:
 *         description: Paginated list of payments
 */
router.get('/', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.list);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Payment record
 *       404:
 *         description: Not found
 */
router.get('/:id', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.getById);

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Record a payment (auto-marks billing as paid)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [billingId, amount, paymentMethod]
 *             properties:
 *               billingId: { type: string, format: uuid }
 *               amount: { type: number }
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, bank_transfer, card, mobile_money, cheque]
 *     responses:
 *       201:
 *         description: Payment recorded
 *       409:
 *         description: Billing already paid
 */
router.post('/', authorize('superadmin', 'admin', 'manager', 'tenant'), createRules, validate, ctrl.create);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   put:
 *     summary: Update payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Payment updated
 */
router.put('/:id', authorize('superadmin', 'admin', 'manager'), updateRules, validate, ctrl.update);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   delete:
 *     summary: Delete payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Payment deleted
 */
router.delete('/:id', authorize('superadmin', 'admin'), ctrl.remove);

module.exports = router;