const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../database/prisma/client');
const { AppError } = require('./error.middleware');

/**
 * Verifies the access token and attaches the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findFirst({
      where: { id: decoded.sub, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        status: true,
        mustChangePassword: true,
      },
    });

    if (!user) throw new AppError('User not found.', 401, 'UNAUTHORIZED');
    if (user.status !== 'active') throw new AppError('Account is not active.', 403, 'FORBIDDEN');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Generate access token.
 */
const generateAccessToken = (userId) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * Generate refresh token.
 */
const generateRefreshToken = (userId) =>
  jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

/**
 * Verify refresh token.
 */
const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

module.exports = { authenticate, generateAccessToken, generateRefreshToken, verifyRefreshToken };