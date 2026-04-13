const express = require('express');
const router = express.Router();
const ctrl = require('./organizations.controller');
const { createRules, updateRules } = require('./organizations.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { superadminOnly } = require('../../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization management (Superadmin only)
 */

router.use(authenticate, superadminOnly);

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: List all organizations
 *     tags: [Organizations]
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
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, suspended] }
 *     responses:
 *       200:
 *         description: Paginated list of organizations
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization data
 *       404:
 *         description: Not found
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     summary: Create organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       201:
 *         description: Organization created
 */
router.post('/', createRules, validate, ctrl.create);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization updated
 */
router.put('/:id', updateRules, validate, ctrl.update);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   delete:
 *     summary: Soft-delete organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization deleted
 */
router.delete('/:id', ctrl.remove);

module.exports = router;