const { body } = require('express-validator');

const createRules = [
  body('apartmentId').isUUID().withMessage('Valid apartment ID is required.'),
  body('tenantId').isUUID().withMessage('Valid tenant ID is required.'),
  body('startDate').isISO8601().withMessage('Valid start date is required.'),
  body('endDate').isISO8601().withMessage('Valid end date is required.'),
  body('rentAmount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid rent amount is required.'),
  body('status').optional().isIn(['active', 'pending', 'expired', 'terminated']),
  body('securityDeposit').optional().isDecimal({ decimal_digits: '0,2' }),
  body('terms').optional().isLength({ max: 5000 }),
];

const updateRules = [
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('rentAmount').optional().isDecimal({ decimal_digits: '0,2' }),
  body('status').optional().isIn(['active', 'pending', 'expired', 'terminated']),
  body('securityDeposit').optional().isDecimal({ decimal_digits: '0,2' }),
  body('terms').optional().isLength({ max: 5000 }),
];

module.exports = { createRules, updateRules };

