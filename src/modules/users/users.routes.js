const express = require('express');
const router = express.Router();
const ctrl = require('./users.controller');
const { createRules, updateRules, assignBuildingRules } = require('./users.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { adminOnly, managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users in the organization
 *     tags: [Users]
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
 *         name: role
 *         schema: { type: string, enum: [admin, manager, tenant] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, suspended] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get('/', managerOrAbove, ctrl.list);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: Not found
 */
router.get('/:id', managerOrAbove, ctrl.getById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a user (admin | manager | tenant)
 *     description: >
 *       Creates a new user account. A secure temporary password is automatically
 *       generated and emailed to the user. The password is never returned in the
 *       API response. The user will be forced to change their password on first login
 *       (`mustChangePassword: true`).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alice Johnson
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@property.com
 *               role:
 *                 type: string
 *                 enum: [admin, manager, tenant]
 *                 example: manager
 *     responses:
 *       201:
 *         description: User created. Credentials emailed to user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User created. Login credentials have been sent to their email." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     mustChangePassword: { type: boolean, example: true }
 *       409:
 *         description: Email already in use
 */
router.post('/', adminOnly, createRules, validate, ctrl.create);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user (name, role, status)
 *     description: Admins can update name, role, and status. Password changes are not allowed here — use reset-password.
 *     tags: [Users]
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
 *               name: { type: string }
 *               role: { type: string, enum: [admin, manager, tenant] }
 *               status: { type: string, enum: [active, inactive, suspended] }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', adminOnly, updateRules, validate, ctrl.update);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Soft-delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', adminOnly, ctrl.remove);

/**
 * @swagger
 * /api/v1/users/{id}/reset-password:
 *   post:
 *     summary: Reset a user's password (Admin only)
 *     description: >
 *       Generates a new secure temporary password, emails it to the user,
 *       and sets `mustChangePassword = true`. All existing sessions are invalidated.
 *       Use this if a user is locked out or requests a reset.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Password reset. New credentials sent to user's email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Password reset. New credentials sent to user's email." }
 *       404:
 *         description: User not found
 */
router.post('/:id/reset-password', adminOnly, ctrl.resetPassword);

/**
 * @swagger
 * /api/v1/users/{id}/buildings:
 *   get:
 *     summary: Get buildings assigned to a manager
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of assigned buildings
 */
router.get('/:id/buildings', managerOrAbove, ctrl.getManagerBuildings);

/**
 * @swagger
 * /api/v1/users/{id}/buildings:
 *   post:
 *     summary: Assign a building to a manager
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [buildingId]
 *             properties:
 *               buildingId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Building assigned to manager
 */
router.post('/:id/buildings', adminOnly, assignBuildingRules, validate, ctrl.assignBuilding);

/**
 * @swagger
 * /api/v1/users/{id}/buildings/{buildingId}:
 *   delete:
 *     summary: Unassign a building from a manager
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Building unassigned
 */
router.delete('/:id/buildings/:buildingId', adminOnly, ctrl.unassignBuilding);

module.exports = router;