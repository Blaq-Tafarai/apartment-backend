const { body } = require('express-validator');

const CATEGORIES = ['repairs', 'utilities', 'cleaning', 'security', 'insurance', 'taxes', 'other'];

const createRules = [
  body('buildingId').isUUID().withMessage('Valid building ID is required.'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount is required.'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('description').optional().trim(),
];

const updateRules = [
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }),
  body('category').optional().isIn(CATEGORIES),
  body('description').optional().trim(),
];

module.exports = { createRules, updateRules };