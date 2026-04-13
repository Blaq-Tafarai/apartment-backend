const express = require('express');
const router = express.Router();
const ctrl = require('./subscriptions.controller');
const { createRules, updateRules } = require('./subscriptions.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { superadminOnly } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription plan management (Superadmin only)
 */

router.use(authenticate, superadminOnly);

/**
 * @swagger
 * /api/v1/subscriptions:
 *   get:
 *     summary: List all subscriptions
 *     tags: [Subscriptions]
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
 *         schema: { type: string }
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of subscriptions
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/subscriptions/{id}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/subscriptions:
 *   post:
 *     summary: Create subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, planName, billingCycle, price, startDate, endDate]
 *             properties:
 *               organizationId: { type: string }
 *               planName: { type: string }
 *               billingCycle: { type: string, enum: [monthly, quarterly, yearly] }
 *               price: { type: number }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Subscription created
 */
router.post('/', createRules, validate, ctrl.create);

/**
 * @swagger
 * /api/v1/subscriptions/{id}:
 *   put:
 *     summary: Update subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscription updated
 */
router.put('/:id', updateRules, validate, ctrl.update);

/**
 * @swagger
 * /api/v1/subscriptions/{id}:
 *   delete:
 *     summary: Delete subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscription deleted
 */
router.delete('/:id', ctrl.remove);

module.exports = router;