/**
 * src/queues/email.queue.js
 *
 * Email queue producer.
 * Services call these typed functions instead of sending emails directly.
 * The actual sending is done by src/workers/email.worker.js.
 *
 * Usage:
 *   const emailQueue = require('../queues/email.queue');
 *   await emailQueue.addCredentialsJob({ to, name, role, password });
 */

const { Queue } = require('bullmq');
const { getBullMQConnection, DEFAULT_JOB_OPTIONS, QUEUE_NAMES, EMAIL_JOBS } = require('../config/queue');
const logger = require('../config/logger');

// Single queue instance — module-level singleton
let emailQueue = null;

const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
      connection: getBullMQConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });

    emailQueue.on('error', (err) => {
      logger.error({ err, queue: QUEUE_NAMES.EMAIL }, 'Email queue error');
    });
  }
  return emailQueue;
};

// ─── Typed job adders ─────────────────────────────────────────────────────────

/**
 * Queue a credentials email (sent when an admin creates a user/tenant).
 * @param {{ to: string, name: string, role: string, password: string }} data
 */
const addCredentialsJob = (data) =>
  getEmailQueue().add(EMAIL_JOBS.SEND_CREDENTIALS, data, {
    priority: 1, // highest priority — user is waiting
  });

/**
 * Queue a password-reset OTP email.
 * @param {{ to: string, name: string, otp: string, ttlMinutes: number }} data
 */
const addOtpJob = (data) =>
  getEmailQueue().add(EMAIL_JOBS.SEND_OTP, data, {
    priority: 1, // high priority — user is actively trying to log in
    attempts: 5, // more retries for OTP — critical path
  });

/**
 * Queue a lease expiry notification email.
 * @param {{ to: string, name: string, expiryDate: string }} data
 */
const addLeaseExpiryJob = (data) =>
  getEmailQueue().add(EMAIL_JOBS.SEND_LEASE_EXPIRY, data, {
    priority: 5, // lower priority — informational
  });

/**
 * Queue a payment receipt email.
 * @param {{ to: string, name: string, amount: string|number, date: string }} data
 */
const addPaymentReceiptJob = (data) =>
  getEmailQueue().add(EMAIL_JOBS.SEND_PAYMENT_RECEIPT, data, {
    priority: 3,
  });

/**
 * Queue a welcome email (self-registration).
 * @param {{ to: string, name: string }} data
 */
const addWelcomeJob = (data) =>
  getEmailQueue().add(EMAIL_JOBS.SEND_WELCOME, data, {
    priority: 5,
  });

/**
 * Close the queue connection gracefully (call on shutdown).
 */
const closeEmailQueue = async () => {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
    logger.info('Email queue closed');
  }
};

module.exports = {
  getEmailQueue,
  addCredentialsJob,
  addOtpJob,
  addLeaseExpiryJob,
  addPaymentReceiptJob,
  addWelcomeJob,
  closeEmailQueue,
};