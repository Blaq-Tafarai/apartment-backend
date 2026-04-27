const { body } = require('express-validator');

const createRules = [
  body('organizationId').isUUID().withMessage('Valid organizationId required.'),
  body('planName').trim().notEmpty().withMessage('Plan name is required.'),
  body('billingCycle').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid billing cycle.'),
  body('price').isDecimal().withMessage('Price must be a decimal number.').toFloat(),
  body('startDate').isISO8601().withMessage('Valid startDate required.').toDate(),
  body('endDate').isISO8601().withMessage('Valid endDate required.').toDate(),
];

const updateRules = [
  body('planName').optional().trim().notEmpty(),
  body('billingCycle').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('price').optional().isDecimal().toFloat(),
  body('status').optional().isIn(['active', 'inactive', 'cancelled', 'expired']),
  body('startDate').optional().isISO8601().toDate(),
  body('endDate').optional().isISO8601().toDate(),
];

module.exports = { createRules, updateRules };