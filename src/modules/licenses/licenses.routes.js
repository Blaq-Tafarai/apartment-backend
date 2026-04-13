const express = require('express');
const router = express.Router();
const ctrl = require('./licenses.controller');
const { createRules, updateRules } = require('./licenses.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { superadminOnly } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Licenses
 *   description: License management (Superadmin only)
 */

router.use(authenticate, superadminOnly);

/**
 * @swagger
 * /api/v1/licenses:
 *   get:
 *     summary: List all licenses
 *     tags: [Licenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of licenses
 */
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/licenses:
 *   post:
 *     summary: Create license
 *     tags: [Licenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, subscriptionId, maxUsers, maxBuildings, maxApartments, expiresAt]
 *             properties:
 *               organizationId: { type: string }
 *               subscriptionId: { type: string }
 *               maxUsers: { type: integer }
 *               maxBuildings: { type: integer }
 *               maxApartments: { type: integer }
 *               features: { type: object }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: License created
 */
router.post('/', createRules, validate, ctrl.create);
router.put('/:id', updateRules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;