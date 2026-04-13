const express = require('express');
const router = express.Router();
const ctrl = require('./auth.controller');
const {
  registerRules,
  loginRules,
  refreshRules,
  changePasswordRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordWithOtpRules,
} = require('./auth.validation');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../../middleware/rateLimit.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: >
 *     Authentication endpoints.
 *
 *     **Forgot-password OTP flow (3 steps):**
 *
 *     1. `POST /forgot-password` — submit your email, receive a 6-digit OTP by email.
 *     2. `POST /verify-otp`      — submit email + OTP, receive a short-lived `resetToken`.
 *     3. `POST /reset-password`  — submit new password with `resetToken` in Authorization header.
 */

// ─── Public / unauthenticated ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Self-register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: John Doe }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [admin, manager, tenant] }
 *               organizationId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Email already in use
 */
router.post('/register', authLimiter, registerRules, validate, ctrl.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: >
 *       Returns access token, refresh token, and user profile.
 *       Check `mustChangePassword` — if `true`, redirect user to `PUT /change-password`
 *       before allowing access to any other endpoint.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     mustChangePassword: { type: boolean, example: false }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         mustChangePassword: { type: boolean }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, loginRules, validate, ctrl.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New token pair
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', ctrl.refresh); // No body validation — token comes from HTTP-only cookie (body is fallback only)

// ─── Forgot Password OTP Flow (no auth required) ──────────────────────────────

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: "Step 1 — Request a password reset OTP"
 *     description: >
 *       Submit an email address. If an active account exists, a **6-digit OTP**
 *       is generated, stored as a bcrypt hash, and sent to that email address.
 *
 *       The OTP expires in **10 minutes** and can only be used once.
 *
 *       **Security:** The response is always identical whether the email exists or not,
 *       to prevent account enumeration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@gmail.com
 *     responses:
 *       200:
 *         description: OTP sent (same response whether email exists or not)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message:
 *                   type: string
 *                   example: "If an account with that email exists, a reset code has been sent. Check your inbox."
 */
router.post('/forgot-password', otpLimiter, forgotPasswordRules, validate, ctrl.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: "Step 2 — Verify the OTP code"
 *     description: >
 *       Submit the email address and the 6-digit OTP received by email.
 *
 *       On success, a short-lived **resetToken** (JWT, 15 min) is returned.
 *       Pass this token in the `Authorization: Bearer <resetToken>` header
 *       when calling `POST /reset-password` (step 3).
 *
 *       **Failed attempts:** Each wrong OTP increments an attempt counter.
 *       After **5 wrong attempts** the OTP is permanently locked and a new one must be requested.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@gmail.com
 *               otp:
 *                 type: string
 *                 example: "483920"
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: OTP verified — resetToken returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OTP verified. Use the resetToken to set your new password." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       description: Short-lived JWT. Use as Bearer token in POST /reset-password.
 *       400:
 *         description: Invalid OTP, expired OTP, or too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 code: { type: string, example: INVALID_OTP }
 *                 message: { type: string, example: "Incorrect OTP. 4 attempts remaining." }
 */
router.post('/verify-otp', otpLimiter, verifyOtpRules, validate, ctrl.verifyOtp);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: "Step 3 — Set a new password using the resetToken"
 *     description: >
 *       Set a new password. Requires the `resetToken` from step 2 in the
 *       `Authorization: Bearer <resetToken>` header.
 *
 *       On success:
 *       - The new password is saved
 *       - `mustChangePassword` is set to `false`
 *       - All existing sessions (refresh tokens) are invalidated
 *       - The user must log in again with the new password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "MyNewSecure@Pass1"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Password reset successfully. Please log in with your new password." }
 *       401:
 *         description: Missing or invalid resetToken
 */
router.post('/reset-password', authenticate, resetPasswordWithOtpRules, validate, ctrl.resetPassword);

// ─── Authenticated ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout (invalidates refresh token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', ctrl.logout); // No auth required — reads refresh token from cookie to invalidate

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     mustChangePassword: { type: boolean }
 */
router.get('/me', authenticate, ctrl.getMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: Change password (while logged in)
 *     description: >
 *       For authenticated users who know their current password.
 *       Also used by users with `mustChangePassword = true` on first login.
 *       On success, all sessions are invalidated — the user must log in again.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed. Log in again.
 *       400:
 *         description: Current password incorrect or same as new
 */
router.put('/change-password', authenticate, changePasswordRules, validate, ctrl.changePassword);

module.exports = router;