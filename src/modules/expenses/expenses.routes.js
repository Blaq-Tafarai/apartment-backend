const express = require('express');
const router = express.Router();
const ctrl = require('./expenses.controller');
const { createRules, updateRules } = require('./expenses.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Building expense management
 */

router.use(authenticate, scopeOrganization, managerOrAbove);

/**
 * @swagger
 * /api/v1/expenses:
 *   get:
 *     summary: List expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: buildingId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [repairs, utilities, cleaning, security, insurance, taxes, other]
 *     responses:
 *       200:
 *         description: Paginated list of expenses
 */
router.get('/', ctrl.list);
router.get('/summary/:buildingId', ctrl.summary);
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/expenses:
 *   post:
 *     summary: Create an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buildingId, amount, category]
 *             properties:
 *               buildingId: { type: string, format: uuid }
 *               amount: { type: number }
 *               category: { type: string, enum: [repairs, utilities, cleaning, security, insurance, taxes, other] }
 *               description: { type: string }
 *               paymentMethod: { type: string, enum: [cash, bank_transfer, card, mobile_money, cheque] }
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post('/', createRules, validate, ctrl.create);
router.put('/:id', updateRules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;