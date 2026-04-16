const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Building name is required.'),
  body('address').isLength({ max: 255 }).withMessage('Address must be at most 255 characters.'),
  body('units').isInt({ min: 1, max: 1000 }).withMessage('Units must be between 1 and 1000.'),
  body('status').isIn(['active', 'inactive', 'under_construction', 'maintenance']).withMessage('Invalid status.'),
  body('yearBuilt').isInt().withMessage('Year built must be a valid year.'),
  body('totalSqft').isInt().withMessage('Total square footage must be a valid number.'),
  body('description').isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters.'),
];

const updateRules = [
  body('name').optional().trim().notEmpty(),
  body('address').optional().trim().notEmpty(),
  body('units').optional().isInt({ min: 1, max: 1000 }),
  body('status').optional().isIn(['active', 'inactive', 'under_construction', 'maintenance']),
  body('yearBuilt').optional().isInt(),
  body('totalSqft').optional().isInt(),
  body('description').optional().isLength({ max: 1000 }),
];

module.exports = { createRules, updateRules };
