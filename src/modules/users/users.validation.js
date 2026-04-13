const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  // password is NOT accepted — it is auto-generated and emailed to the user
  body('role')
    .isIn(['admin', 'manager', 'tenant'])
    .withMessage('Role must be admin, manager, or tenant.'),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'tenant'])
    .withMessage('Role must be admin, manager, or tenant.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status.'),
];

const assignBuildingRules = [
  body('buildingId').isUUID().withMessage('Valid building ID is required.'),
];

module.exports = { createRules, updateRules, assignBuildingRules };