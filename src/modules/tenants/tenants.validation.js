const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('apartmentId').optional().isUUID().withMessage('Invalid apartment ID.'),
];

const updateRules = [
  body('apartmentId').optional().isUUID().withMessage('Invalid apartment ID.'),
];

module.exports = { createRules, updateRules };