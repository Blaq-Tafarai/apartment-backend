const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Organization name is required.'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
];

const updateRules = [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
];

module.exports = { createRules, updateRules };