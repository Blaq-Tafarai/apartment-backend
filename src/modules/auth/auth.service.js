/**
 * src/modules/auth/auth.service.js
 *
 * All email sending is done via BullMQ queues — never directly.
 * This ensures emails are retried on failure and don't block the HTTP response.
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

// ─── Shared select shape ──────────────────────────────────────────────────────

const SAFE_USER_SELECT = {
  id: true, name: true, email: true, role: true,
  organizationId: true, status: true, mustChangePassword: true, createdAt: true,
};

// ─── Register ────────────────────────────────────────────────────────────────

const register = async ({ name, email, password, role, organizationId }) => {
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

  return { user, accessToken, refreshToken };
};

// ─── Login ───────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, name: true, email: true, password: true, role: true, organizationId: true, status: true, mustChangePassword: true },
  });

  if (!user) throw new AppError('Invalid credentials.', 401, 'UNAUTHORIZED');
  if (user.status !== 'active') throw new AppError('Account is not active.', 403, 'FORBIDDEN');

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid credentials.', 401, 'UNAUTHORIZED');

  const accessToken  = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  const { password: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken, mustChangePassword: safeUser.mustChangePassword };
};

// ─── Refresh ─────────────────────────────────────────────────────────────────

const refreshTokens = async (token) => {
  let decoded;
  try { decoded = verifyRefreshToken(token); }
  catch { throw new AppError('Invalid refresh token.', 401, 'UNAUTHORIZED'); }

  const user = await prisma.user.findFirst({ where: { id: decoded.sub, refreshToken: token, deletedAt: null } });
  if (!user) throw new AppError('Invalid refresh token.', 401, 'UNAUTHORIZED');

  const accessToken  = generateAccessToken(user.id);
  const newRefresh   = generateRefreshToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });

  return { accessToken, refreshToken: newRefresh };
};

// ─── Logout ──────────────────────────────────────────────────────────────────

const logout = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

// ─── Me ──────────────────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: SAFE_USER_SELECT });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  return user;
};

// ─── Change Password (authenticated — knows current password) ────────────────

const changePassword = async (userId, { currentPassword, newPassword }) => {
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

  // Always return the same response — prevents account enumeration
  if (!user || user.status !== 'active') return SAFE_RESPONSE;

  // Invalidate any existing unused OTPs for this user
  await prisma.passwordResetOtp.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate and hash new OTP
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

  // Enqueue email via BullMQ — non-blocking, retried automatically on failure
  await addOtpJob({ to: user.email, name: user.name, otp: plainOtp, ttlMinutes: OTP_TTL_MINUTES });

  logger.info({ userId: user.id }, 'Password reset OTP queued');
  return SAFE_RESPONSE;
};

// ─── Verify OTP — Step 2: Validate the code ──────────────────────────────────

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
    await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    const remaining = 5 - (record.attempts + 1);
    throw new AppError(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new OTP.',
      400,
      'INVALID_OTP'
    );
  }

  // Mark OTP as consumed — prevents replay
  await prisma.passwordResetOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } });

  // Issue a short-lived reset token for step 3
  const resetToken = generateAccessToken(record.userId);

  logger.info({ userId: record.userId }, 'OTP verified — reset token issued');
  return { message: 'OTP verified. Use the resetToken to set your new password.', resetToken };
};

// ─── Reset Password — Step 3: Set new password with resetToken ───────────────

const resetPasswordWithOtp = async (userId, { newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: false, refreshToken: null },
  });

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