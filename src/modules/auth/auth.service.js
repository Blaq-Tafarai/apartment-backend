/**
 * src/modules/auth/auth.service.js
 *
 * Cookie-first auth strategy:
 *  - Login:   sets refreshToken in an HTTP-only cookie AND returns accessToken in body
 *  - Refresh: reads refreshToken from cookie (preferred) OR request body (fallback)
 *  - Logout:  clears the cookie; does NOT require a Bearer token
 *
 * This matches the frontend pattern where:
 *  - accessToken is kept in memory (useRef)
 *  - refreshToken lives only in the HTTP-only cookie (never accessible to JS)
 */

const prisma = require('../../database/prisma/client');
const { hashPassword, comparePassword } = require('../../utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../middleware/auth.middleware');
const {
  generateOtp,
  hashOtp,
  verifyOtp,
  otpExpiresAt,
  checkOtpRecord,
  OTP_TTL_MINUTES,
} = require('../../utils/otp');
const { addOtpJob } = require('../../queues/email.queue');
const { AppError }  = require('../../middleware/error.middleware');
const logger        = require('../../config/logger');

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const REFRESH_COOKIE_NAME = 'refreshToken';

/**
 * Cookie options for the refresh token.
 * httpOnly: JS cannot read it → XSS-safe
 * secure:   HTTPS-only in production
 * sameSite: 'strict' blocks CSRF
 * maxAge:   7 days in milliseconds
 */
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

const clearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
});

// ─── Shared select shape ──────────────────────────────────────────────────────

const SAFE_USER_SELECT = {
  id: true, name: true, email: true, role: true,
  organizationId: true, status: true, mustChangePassword: true, createdAt: true,
};

// ─── Register ────────────────────────────────────────────────────────────────

const register = async ({ name, email, password, role, organizationId }, res) => {
  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) throw new AppError('Email already in use.', 409, 'CONFLICT');

  const hashed = await hashPassword(password);
  const user   = await prisma.user.create({
    data: { name, email, password: hashed, role: role || 'tenant', organizationId, mustChangePassword: false },
    select: SAFE_USER_SELECT,
  });

  const accessToken  = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  // Set refresh token in HTTP-only cookie
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  return { user, accessToken };
};

// ─── Login ───────────────────────────────────────────────────────────────────

const login = async ({ email, password }, res) => {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: {
      id: true, name: true, email: true, password: true,
      role: true, organizationId: true, status: true, mustChangePassword: true,
    },
  });

  if (!user) throw new AppError('Invalid credentials.', 401, 'UNAUTHORIZED');
  if (user.status !== 'active') throw new AppError('Account is not active.', 403, 'FORBIDDEN');

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid credentials.', 401, 'UNAUTHORIZED');

  const accessToken  = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  // Set refresh token in HTTP-only cookie — never returned in body
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  const { password: _, ...safeUser } = user;
  return {
    user: safeUser,
    accessToken,
    mustChangePassword: safeUser.mustChangePassword,
    // refreshToken intentionally NOT in body — lives in HTTP-only cookie only
  };
};

// ─── Refresh ─────────────────────────────────────────────────────────────────

/**
 * Reads the refresh token from:
 *   1. HTTP-only cookie (preferred — frontend uses this)
 *   2. Request body `refreshToken` field (fallback for API clients / Postman)
 *
 * Issues a new access token AND rotates the refresh token (new cookie).
 */
const refreshTokens = async (req, res) => {
  // Cookie-first, body fallback
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (!token) {
    throw new AppError(
      'No refresh token provided. Please log in again.',
      401,
      'UNAUTHORIZED'
    );
  }

  let decoded;
  try { decoded = verifyRefreshToken(token); }
  catch { throw new AppError('Invalid or expired refresh token. Please log in again.', 401, 'UNAUTHORIZED'); }

  const user = await prisma.user.findFirst({
    where: { id: decoded.sub, refreshToken: token, deletedAt: null },
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    // Token was valid JWT but not in DB — possible token reuse attack
    // Clear the cookie defensively
    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
    throw new AppError('Refresh token reuse detected. Please log in again.', 401, 'UNAUTHORIZED');
  }

  const accessToken     = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

  // Rotate the cookie
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

  return { user, accessToken };
};

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * Clears the refresh token cookie and invalidates the token in the DB.
 * Works even without a Bearer token — looks up the user via the cookie.
 * If neither cookie nor Bearer token is present, still succeeds (idempotent).
 */
const logout = async (req, res) => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const userId      = req.user?.id; // set by authenticate middleware if Bearer was sent

  // Invalidate refresh token in DB (from cookie path)
  if (cookieToken) {
    try {
      const decoded = verifyRefreshToken(cookieToken);
      await prisma.user.updateMany({
        where: { id: decoded.sub, refreshToken: cookieToken },
        data: { refreshToken: null },
      });
    } catch {
      // Cookie had invalid/expired token — still clear it
    }
  }

  // Invalidate from Bearer token path (if authenticate middleware ran)
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    }).catch(() => {}); // Ignore if already null
  }

  // Always clear the cookie
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
};

// ─── Me ──────────────────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: SAFE_USER_SELECT });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  return user;
};

// ─── Change Password ─────────────────────────────────────────────────────────

const changePassword = async (userId, { currentPassword, newPassword }, res) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect.', 400, 'BAD_REQUEST');

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from your current password.', 400, 'BAD_REQUEST');
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: false, refreshToken: null },
  });

  // Clear the refresh cookie — user must log in again with new password
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
};

// ─── Forgot Password — Step 1: Request OTP ───────────────────────────────────

const forgotPassword = async ({ email }) => {
  const SAFE_RESPONSE = {
    message: 'If an account with that email exists, a reset code has been sent. Check your inbox.',
  };

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!user || user.status !== 'active') return SAFE_RESPONSE;

  await prisma.passwordResetOtp.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const plainOtp = generateOtp();
  const hashed   = await hashOtp(plainOtp);

  await prisma.passwordResetOtp.create({
    data: {
      userId:    user.id,
      email:     user.email,
      otpHash:   hashed,
      purpose:   'password_reset',
      expiresAt: otpExpiresAt(),
    },
  });

  await addOtpJob({ to: user.email, name: user.name, otp: plainOtp, ttlMinutes: OTP_TTL_MINUTES });
  logger.info({ userId: user.id }, 'Password reset OTP queued');

  return SAFE_RESPONSE;
};

// ─── Verify OTP — Step 2 ─────────────────────────────────────────────────────

const verifyPasswordOtp = async ({ email, otp }) => {
  const record = await prisma.passwordResetOtp.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() }, purpose: 'password_reset' },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError('No valid reset code found. Please request a new one.', 400, 'INVALID_OTP');
  }

  const { valid, reason } = checkOtpRecord(record);
  if (!valid) throw new AppError(reason, 400, 'INVALID_OTP');

  const isMatch = await verifyOtp(otp, record.otpHash);

  if (!isMatch) {
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = 5 - (record.attempts + 1);
    throw new AppError(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new OTP.',
      400,
      'INVALID_OTP'
    );
  }

  await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });

  const resetToken = generateAccessToken(record.userId);
  logger.info({ userId: record.userId }, 'OTP verified — reset token issued');

  return { message: 'OTP verified. Use the resetToken to set your new password.', resetToken };
};

// ─── Reset Password — Step 3 ─────────────────────────────────────────────────

const resetPasswordWithOtp = async (userId, { newPassword }, res) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: false, refreshToken: null },
  });

  // Clear any stale refresh cookie
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
  logger.info({ userId }, 'Password reset via OTP completed');
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyPasswordOtp,
  resetPasswordWithOtp,
};