const express = require('express');
const router = express.Router();
const ctrl = require('./billings.controller');
const { createRules, updateRules } = require('./billings.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');

/**
 * @swagger
 * tags:
 *   name: Billings
 *   description: Billing management
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/billings:
 *   get:
 *     summary: List billing records
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, paid, overdue, cancelled] }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated billing list
 */
router.get('/', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.list);
router.get('/:id', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.getById);
router.post('/', authorize('superadmin', 'admin', 'manager'), createRules, validate, ctrl.create);
router.put('/:id', authorize('superadmin', 'admin', 'manager'), updateRules, validate, ctrl.update);
router.delete('/:id', authorize('superadmin', 'admin'), ctrl.remove);

module.exports = router;