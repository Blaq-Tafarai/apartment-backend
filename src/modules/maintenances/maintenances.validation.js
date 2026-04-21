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
  body('completedAt').optional().isISO8601().withMessage('Valid ISO datetime required.'),
  body('estimatedCost').optional().isFloat({ min: 0 }).toFloat().withMessage('Estimated cost must be positive number.'),
  body('actualCost').optional().isFloat({ min: 0 }).toFloat().withMessage('Actual cost must be positive number.'),
  body('note').optional().trim().isLength({ max: 1000 }).withMessage('Note max 1000 chars.'),
];


module.exports = { createRules, updateRules };