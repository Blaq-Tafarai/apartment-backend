const { body } = require('express-validator');

const createRules = [
  body('apartmentId').isUUID().withMessage('Valid apartment ID is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('tenantId').optional().isUUID(),
  body('assignedManagerId').optional().isUUID(),
];

const updateRules = [
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  body('description').optional().trim().notEmpty(),
  body('assignedManagerId').optional().isUUID(),
];

module.exports = { createRules, updateRules };