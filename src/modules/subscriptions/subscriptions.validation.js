const { body } = require('express-validator');

const createRules = [
  body('organizationId').isUUID().withMessage('Valid organizationId required.'),
  body('planName').trim().notEmpty().withMessage('Plan name is required.'),
  body('billingCycle').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid billing cycle.'),
  body('price').isDecimal().withMessage('Price must be a decimal number.'),
  body('startDate').isISO8601().withMessage('Valid startDate required.'),
  body('endDate').isISO8601().withMessage('Valid endDate required.'),
];

const updateRules = [
  body('planName').optional().trim().notEmpty(),
  body('billingCycle').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('price').optional().isDecimal(),
  body('status').optional().isIn(['active', 'inactive', 'cancelled', 'expired']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
];

module.exports = { createRules, updateRules };