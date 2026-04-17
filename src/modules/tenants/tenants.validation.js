const { body } = require('express-validator');

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('phone').optional().isMobilePhone('en-US').withMessage('Valid phone number required.'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
  body('emergencyName').optional().trim().notEmpty().withMessage('Emergency name required if provided.'),
  body('emergencyPhone').optional().isMobilePhone('en-US').withMessage('Valid emergency phone required.'),
  body('emergencyRelationship').optional().trim().notEmpty().withMessage('Emergency relationship required if provided.'),
  body('apartmentId').optional().isUUID().withMessage('Invalid apartment ID.'),
];

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('phone').optional().isMobilePhone('en-US').withMessage('Valid phone number required.'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
  body('emergencyName').optional().trim().notEmpty().withMessage('Emergency name required if provided.'),
  body('emergencyPhone').optional().isMobilePhone('en-US').withMessage('Valid emergency phone required.'),
  body('emergencyRelationship').optional().trim().notEmpty().withMessage('Emergency relationship required if provided.'),
  body('apartmentId').optional().isUUID().withMessage('Invalid apartment ID.'),
];

module.exports = { createRules, updateRules };