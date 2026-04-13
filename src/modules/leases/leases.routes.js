const express = require('express');
const router = express.Router();
const ctrl = require('./leases.controller');
const { createRules, updateRules } = require('./leases.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Leases
 *   description: Lease management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/leases:
 *   get:
 *     summary: List leases
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, pending, expired, terminated] }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *       - in: query
 *         name: apartmentId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of leases
 */
router.get('/', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.list);
router.get('/:id', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.getById);

/**
 * @swagger
 * /api/v1/leases:
 *   post:
 *     summary: Create a lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [apartmentId, tenantId, startDate, endDate, rentAmount]
 *             properties:
 *               apartmentId: { type: string, format: uuid }
 *               tenantId: { type: string, format: uuid }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               rentAmount: { type: number }
 *     responses:
 *       201:
 *         description: Lease created
 */
router.post('/', authorize('superadmin', 'admin', 'manager'), createRules, validate, ctrl.create);
router.put('/:id', authorize('superadmin', 'admin', 'manager'), updateRules, validate, ctrl.update);
router.patch('/:id/terminate', authorize('superadmin', 'admin', 'manager'), ctrl.terminate);
router.delete('/:id', authorize('superadmin', 'admin'), ctrl.remove);

module.exports = router;