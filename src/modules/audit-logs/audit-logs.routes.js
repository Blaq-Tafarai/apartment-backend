const express = require('express');
const router = express.Router();
const ctrl = require('./audit-logs.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { adminOnly } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: System audit log (Admin/Superadmin only)
 */

router.use(authenticate, scopeOrganization, adminOnly);

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: List audit logs
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [create, update, delete, login, logout, upload] }
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated audit log list
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/audit-logs/{id}:
 *   get:
 *     summary: Get audit log entry by ID
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Audit log entry
 */
router.get('/:id', ctrl.getById);

module.exports = router;