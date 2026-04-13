const express = require('express');
const router = express.Router();
const ctrl = require('./tenants.controller');
const { createRules, updateRules } = require('./tenants.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management
 */

router.use(authenticate, scopeOrganization, managerOrAbove);

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: List tenants in the organization
 *     tags: [Tenants]
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
 *         name: apartmentId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of tenants
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant record with user info and latest lease
 *       404:
 *         description: Not found
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Create a tenant (also creates their user account)
 *     description: >
 *       Creates a user account with role `tenant` and links it to a tenant record.
 *       A secure temporary password is automatically generated and emailed to the tenant.
 *       The password is never returned in the API response.
 *       The tenant will be prompted to change their password on first login (`mustChangePassword: true`).
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@gmail.com
 *               apartmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Assign to an apartment immediately (optional)
 *     responses:
 *       201:
 *         description: Tenant created. Credentials emailed to tenant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         email: { type: string }
 *                         mustChangePassword: { type: boolean, example: true }
 *       409:
 *         description: Email already in use
 */
router.post('/', createRules, validate, ctrl.create);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   put:
 *     summary: Update tenant (reassign to a different apartment)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apartmentId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant updated
 */
router.put('/:id', updateRules, validate, ctrl.update);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   delete:
 *     summary: Soft-delete a tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant deleted
 */
router.delete('/:id', ctrl.remove);

module.exports = router;