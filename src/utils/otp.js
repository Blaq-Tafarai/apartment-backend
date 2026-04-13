const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const OTP_LENGTH = 6;        // 6-digit code
const OTP_TTL_MINUTES = 10;  // expires after 10 minutes
const MAX_ATTEMPTS = 5;      // lock out after 5 wrong guesses

/**
 * Generate a cryptographically random N-digit OTP string.
 * Uses crypto.randomInt to avoid modulo bias.
 * @returns {string} e.g. "483920"
 */
const generateOtp = (length = OTP_LENGTH) => {
  const digits = Array.from(
    { length },
    () => crypto.randomInt(0, 10) // 0–9 inclusive
  );
  return digits.join('');
};

/**
 * Hash an OTP using bcrypt so it is never stored in plain text.
 * @param {string} otp
 * @returns {Promise<string>} bcrypt hash
 */
const hashOtp = (otp) => bcrypt.hash(otp, 10);

/**
 * Compare a plain OTP against its stored hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const verifyOtp = (plain, hash) => bcrypt.compare(plain, hash);

/**
 * Return the expiry Date object for a new OTP.
 * @returns {Date}
 */
const otpExpiresAt = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_TTL_MINUTES);
  return d;
};

/**
 * Check if an OTP record is still valid (not expired, not used, not over attempt limit).
 * @param {{ expiresAt: Date, usedAt: Date|null, attempts: number }} record
 * @returns {{ valid: boolean, reason?: string }}
 */
const checkOtpRecord = (record) => {
  if (record.usedAt) {
    return { valid: false, reason: 'This OTP has already been used.' };
  }
  if (new Date() > new Date(record.expiresAt)) {
    return { valid: false, reason: 'This OTP has expired. Please request a new one.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }
  return { valid: true };
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  otpExpiresAt,
  checkOtpRecord,
  OTP_TTL_MINUTES,
  MAX_ATTEMPTS,
};