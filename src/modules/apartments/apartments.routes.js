const express = require('express');
const router = express.Router();
const ctrl = require('./apartments.controller');
const { createRules, updateRules } = require('./apartments.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize, managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Apartments
 *   description: Apartment management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/apartments:
 *   get:
 *     summary: List apartments
 *     tags: [Apartments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buildingId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [available, occupied, under_maintenance, inactive] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of apartments
 */
router.get('/', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.list);

/**
 * @swagger
 * /api/v1/apartments/{id}:
 *   get:
 *     summary: Get apartment by ID
 *     tags: [Apartments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Apartment details
 */
router.get('/:id', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.getById);

/**
 * @swagger
 * /api/v1/apartments:
 *   post:
 *     summary: Create apartment
 *     tags: [Apartments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buildingId, unitNumber]
 *             properties:
 *               buildingId: { type: string }
 *               unitNumber: { type: string }
 *               status: { type: string, enum: [available, occupied, under_maintenance, inactive] }
 *     responses:
 *       201:
 *         description: Apartment created
 */
router.post('/', managerOrAbove, createRules, validate, ctrl.create);
router.put('/:id', managerOrAbove, updateRules, validate, ctrl.update);
router.delete('/:id', managerOrAbove, ctrl.remove);

module.exports = router;