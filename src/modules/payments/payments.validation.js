const { body } = require('express-validator');

const createRules = [
  body('billingId').isUUID().withMessage('Valid billing ID is required.'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valid amount is required (must be a positive number).'),
  body('paymentMethod')
    .isIn(['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque'])
    .withMessage('Valid payment method is required.'),
];

const updateRules = [
  body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'card', 'mobile_money', 'cheque']),
];

module.exports = { createRules, updateRules };