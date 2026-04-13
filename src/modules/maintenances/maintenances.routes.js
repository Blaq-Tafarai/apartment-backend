const express = require('express');
const router = express.Router();
const ctrl = require('./maintenances.controller');
const { createRules, updateRules } = require('./maintenances.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Maintenances
 *   description: Maintenance request management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/maintenances:
 *   get:
 *     summary: List maintenance requests
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in_progress, resolved, closed] }
 *       - in: query
 *         name: apartmentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: assignedManagerId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of maintenance requests
 */
router.get('/', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.list);

/**
 * @swagger
 * /api/v1/maintenances/{id}:
 *   get:
 *     summary: Get maintenance request by ID
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Maintenance request
 *       404:
 *         description: Not found
 */
router.get('/:id', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.getById);

/**
 * @swagger
 * /api/v1/maintenances:
 *   post:
 *     summary: Create a maintenance request
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [apartmentId, description]
 *             properties:
 *               apartmentId: { type: string, format: uuid }
 *               description: { type: string }
 *               tenantId: { type: string, format: uuid }
 *               assignedManagerId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Maintenance request created
 */
router.post('/', authorize('superadmin', 'admin', 'manager', 'tenant'), createRules, validate, ctrl.create);

/**
 * @swagger
 * /api/v1/maintenances/{id}:
 *   put:
 *     summary: Update maintenance request (status, assign manager)
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated maintenance request
 */
router.put('/:id', authorize('superadmin', 'admin', 'manager'), updateRules, validate, ctrl.update);

/**
 * @swagger
 * /api/v1/maintenances/{id}:
 *   delete:
 *     summary: Delete maintenance request
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', authorize('superadmin', 'admin', 'manager'), ctrl.remove);

module.exports = router;