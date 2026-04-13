/**
 * src/modules/auth/auth.controller.js
 *
 * Controllers pass both req and res to auth service functions
 * so they can read/write HTTP-only cookies directly.
 */

const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, res);
    res.status(201).json({ success: true, message: 'Registration successful.', data: result });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, res);
    res.status(200).json({ success: true, message: 'Login successful.', data: result });
  } catch (err) { next(err); }
};

/**
 * Refresh — reads refresh token from HTTP-only cookie (preferred) or body (fallback).
 * No validation middleware needed — the token comes from the cookie, not the body.
 */
const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req, res);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

/**
 * Logout — works with or without a Bearer token.
 * Reads the refresh token from the HTTP-only cookie to invalidate it in DB.
 * Always clears the cookie.
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req, res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body, res);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  } catch (err) { next(err); }
};

// ─── Forgot Password / OTP flow ───────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyPasswordOtp(req.body);
    res.status(200).json({
      success: true,
      message: result.message,
      data: { resetToken: result.resetToken },
    });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPasswordWithOtp(req.user.id, req.body, res);
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (err) { next(err); }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
};