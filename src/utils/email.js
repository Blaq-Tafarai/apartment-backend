const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

// ─── Core send helper ────────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html, text });
    logger.info({ messageId: info.messageId, to }, 'Email sent');
    return info;
  } catch (err) {
    logger.error({ err, to }, 'Failed to send email');
    throw err;
  }
};

// ─── Templates ───────────────────────────────────────────────────────────────

const sendWelcomeEmail = (to, name) =>
  sendEmail({
    to,
    subject: 'Welcome to ApartmentBookings',
    html: `<h1>Welcome, ${name}!</h1><p>Your account has been created successfully.</p>`,
  });

/**
 * Send auto-generated login credentials to a newly created user.
 * Called when an admin/manager creates a user (admin, manager, or tenant).
 * The password shown here is the ONLY time it appears in plain text.
 */
const sendCredentialsEmail = (to, name, role, password) =>
  sendEmail({
    to,
    subject: 'Your ApartmentBookings Account Has Been Created',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <h2 style="color:#2d6a4f;">Welcome to ApartmentBookings, ${name}!</h2>
        <p>An account has been created for you with the role: <strong>${role.toUpperCase()}</strong>.</p>
        <p>Use the credentials below to log in for the first time:</p>
        <div style="background:#f4f4f4;border-left:4px solid #2d6a4f;padding:16px;border-radius:4px;margin:16px 0;">
          <p style="margin:6px 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin:6px 0;">
            <strong>Temporary Password:</strong>
            <span style="font-family:monospace;font-size:16px;color:#e63946;letter-spacing:2px;">${password}</span>
          </p>
        </div>
        <p style="color:#e63946;font-weight:bold;">
          ⚠️ You will be required to set a new password immediately after your first login.
        </p>
        <p>Login here: <a href="${env.APP_URL}/login" style="color:#2d6a4f;">${env.APP_URL}/login</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:12px;color:#999;">
          If you did not expect this email, contact your property manager immediately.
          Do not share your password with anyone.
        </p>
      </div>
    `,
    text: [
      `Welcome ${name}!`,
      `Your ${role} account on ApartmentBookings has been created.`,
      `Email: ${to}`,
      `Temporary Password: ${password}`,
      `You must change this password on your first login.`,
      `Login at: ${env.APP_URL}/login`,
    ].join('\n'),
  });

/**
 * Send a 6-digit OTP for password reset.
 * The OTP is displayed prominently and expires after ttlMinutes.
 */
const sendPasswordResetOtpEmail = (to, name, otp, ttlMinutes = 10) =>
  sendEmail({
    to,
    subject: 'Your Password Reset Code — ApartmentBookings',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <h2 style="color:#2d6a4f;">Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset the password for your ApartmentBookings account.</p>
        <p>Use the code below to reset your password. It expires in <strong>${ttlMinutes} minutes</strong>.</p>

        <div style="text-align:center;margin:32px 0;">
          <div style="
            display:inline-block;
            background:#f4f4f4;
            border:2px dashed #2d6a4f;
            border-radius:12px;
            padding:24px 48px;
          ">
            <p style="margin:0;font-size:12px;color:#888;letter-spacing:2px;text-transform:uppercase;">
              Your OTP Code
            </p>
            <p style="
              margin:8px 0 0;
              font-size:42px;
              font-weight:bold;
              font-family:monospace;
              color:#e63946;
              letter-spacing:10px;
            ">${otp}</p>
          </div>
        </div>

        <p style="color:#e63946;font-size:13px;">
          ⚠️ This code is valid for <strong>${ttlMinutes} minutes</strong> and can only be used once.
          Do not share it with anyone.
        </p>
        <p>
          If you did not request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:12px;color:#999;">ApartmentBookings — ${env.APP_URL}</p>
      </div>
    `,
    text: [
      `Hi ${name},`,
      `Your ApartmentBookings password reset OTP code is: ${otp}`,
      `It expires in ${ttlMinutes} minutes and can only be used once.`,
      `If you did not request this, ignore this email.`,
    ].join('\n'),
  });

const sendPasswordResetEmail = (to, resetLink) =>
  sendEmail({
    to,
    subject: 'Password Reset Request',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });

const sendLeaseExpiryEmail = (to, name, expiryDate) =>
  sendEmail({
    to,
    subject: 'Lease Expiry Notice',
    html: `<p>Dear ${name}, your lease expires on <strong>${expiryDate}</strong>. Please contact your manager to renew.</p>`,
  });

const sendPaymentReceiptEmail = (to, name, amount, date) =>
  sendEmail({
    to,
    subject: 'Payment Receipt',
    html: `<p>Dear ${name}, we received your payment of <strong>${amount}</strong> on ${date}. Thank you!</p>`,
  });

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendCredentialsEmail,
  sendPasswordResetOtpEmail,
  sendPasswordResetEmail,
  sendLeaseExpiryEmail,
  sendPaymentReceiptEmail,
};