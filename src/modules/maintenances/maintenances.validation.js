const { body } = require('express-validator');

const createRules = [
  body('apartmentId').isUUID().withMessage('Valid apartment ID is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('tenantId').optional().isUUID(),
  body('assignedManagerId').optional().isUUID(),
  body('category').optional().isIn(['plumbing', 'electrical', 'appliance', 'structural', 'cleaning', 'pest_control', 'other']).withMessage('Invalid category.'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority.'),
];

const updateRules = [
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  body('description').optional().trim().notEmpty(),
  body('assignedManagerId').optional().isUUID(),
  body('category').optional().isIn(['plumbing', 'electrical', 'appliance', 'structural', 'cleaning', 'pest_control', 'other']).withMessage('Invalid category.'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority.'),
];

module.exports = { createRules, updateRules };