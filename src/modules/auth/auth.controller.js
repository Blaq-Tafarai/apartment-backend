const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'Registration successful.', data: result });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, message: 'Login successful.', data: result });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
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
    await authService.changePassword(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  } catch (err) { next(err); }
};

// ─── Forgot Password / OTP flow ───────────────────────────────────────────────

/**
 * Step 1 — POST /api/v1/auth/forgot-password
 * Accepts an email, generates an OTP, and emails it.
 * Always returns 200 regardless of whether the email exists (no enumeration).
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

/**
 * Step 2 — POST /api/v1/auth/verify-otp
 * Accepts email + OTP, validates it, and returns a short-lived resetToken.
 * The frontend must pass this resetToken in the Authorization header for step 3.
 */
const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyPasswordOtp(req.body);
    res.status(200).json({ success: true, message: result.message, data: { resetToken: result.resetToken } });
  } catch (err) { next(err); }
};

/**
 * Step 3 — POST /api/v1/auth/reset-password
 * Accepts newPassword. Requires the resetToken from step 2 in the Authorization header.
 * Sets the new password and invalidates all existing sessions.
 */
const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPasswordWithOtp(req.user.id, req.body);
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