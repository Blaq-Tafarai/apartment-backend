const { body } = require('express-validator');

const createRules = [
  body('buildingId').isUUID().withMessage('Valid buildingId required.'),
  body('unitNumber').trim().notEmpty().withMessage('Unit number is required.'),
  body('status').optional().isIn(['available', 'occupied', 'under_maintenance', 'inactive']),
  body('rent').isInt().withMessage('Rent must be a valid number'),
  body('sqft').isInt().withMessage('Square footage must be a valid number'),
  body('floor').isInt().withMessage('Floor must be a valid number'),
  body('bedrooms').isInt().withMessage('Bedrooms must be a valid number'),
  body('bathrooms').isInt().withMessage('Bathrooms must be a valid number'),
  body('amenities').isArray().withMessage('Amenities must be an array'),
  body('description').isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters.'),
];

const updateRules = [
  body('unitNumber').optional().trim().notEmpty(),
  body('status').optional().isIn(['available', 'occupied', 'under_maintenance', 'inactive']),
  body('rent').optional().isInt(),
  body('sqft').optional().isInt(),
  body('floor').optional().isInt(),
  body('bedrooms').optional().isInt(),
  body('bathrooms').optional().isInt(),
  body('amenities').optional().isArray(),
  body('description').optional().isLength({ max: 1000 }),
];

module.exports = { createRules, updateRules };

