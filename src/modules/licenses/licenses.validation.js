const { body } = require('express-validator');

const createRules = [
  body('organizationId').isUUID(),
  body('subscriptionId').isUUID(),
  body('maxUsers').isInt({ min: 1 }),
  body('maxBuildings').isInt({ min: 1 }),
  body('maxApartments').isInt({ min: 1 }),
  body('expiresAt').isISO8601().toDate(),
];

const updateRules = [
  body('maxUsers').optional().isInt({ min: 1 }),
  body('maxBuildings').optional().isInt({ min: 1 }),
  body('maxApartments').optional().isInt({ min: 1 }),
  body('expiresAt').optional().isISO8601().toDate(),
  body('features').optional().isObject(),
];

module.exports = { createRules, updateRules };