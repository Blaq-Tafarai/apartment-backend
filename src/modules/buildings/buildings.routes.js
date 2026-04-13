const express = require('express');
const router = express.Router();
const ctrl = require('./buildings.controller');
const { createRules, updateRules } = require('./buildings.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { adminOnly, managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Buildings
 *   description: Building management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/buildings:
 *   get:
 *     summary: List buildings
 *     tags: [Buildings]
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
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of buildings
 */
router.get('/', managerOrAbove, ctrl.list);

/**
 * @swagger
 * /api/v1/buildings/{id}:
 *   get:
 *     summary: Get building by ID
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Building details with apartments and managers
 */
router.get('/:id', managerOrAbove, ctrl.getById);

/**
 * @swagger
 * /api/v1/buildings:
 *   post:
 *     summary: Create building
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Building created
 */
router.post('/', adminOnly, createRules, validate, ctrl.create);
router.put('/:id', adminOnly, updateRules, validate, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;