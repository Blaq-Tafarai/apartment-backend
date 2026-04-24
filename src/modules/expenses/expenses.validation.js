const { body } = require('express-validator');

const CATEGORIES = ['repairs', 'utilities', 'cleaning', 'security', 'insurance', 'taxes', 'other'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque'];

const createRules = [
  body('buildingId').isUUID().withMessage('Valid building ID is required.'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount is required.'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('description').optional().trim(),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),
];

const updateRules = [
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }),
  body('category').optional().isIn(CATEGORIES),
  body('description').optional().trim(),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),
];

module.exports = { createRules, updateRules };
