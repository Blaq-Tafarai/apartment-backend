const { body } = require('express-validator');

const createRules = [
  body('tenantId').isUUID().withMessage('Valid tenant ID is required.'),
  body('leaseId').isUUID().withMessage('Valid lease ID is required.'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount is required.'),
  body('dueDate').isISO8601().withMessage('Valid due date is required.'),
  body('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters.'),
  body('issueDate').optional().isISO8601().withMessage('Valid issue date is required.'),
];

const updateRules = [
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }),
  body('dueDate').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']),
  body('description').optional().isLength({ max: 1000 }),
  body('issueDate').optional().isISO8601(),
];

module.exports = { createRules, updateRules };
