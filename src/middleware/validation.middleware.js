const { validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

/**
 * Runs express-validator checks and returns 422 if any fail.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(
      Object.assign(new AppError('Validation failed.', 422, 'VALIDATION_ERROR'), { details })
    );
  }
  return next();
};

module.exports = { validate };