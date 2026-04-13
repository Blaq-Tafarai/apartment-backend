const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('role').optional().isIn(['admin', 'manager', 'tenant']).withMessage('Invalid role.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const refreshRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required.'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

// ─── Forgot Password / OTP flow ───────────────────────────────────────────────

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
];

const verifyOtpRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('otp')
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
    .isNumeric().withMessage('OTP must contain only digits.'),
];

const resetPasswordWithOtpRules = [
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

module.exports = {
  registerRules,
  loginRules,
  refreshRules,
  changePasswordRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordWithOtpRules,
};