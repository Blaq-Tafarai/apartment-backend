/**
 * src/workers/email.worker.js
 *
 * BullMQ email worker.
 * Listens to the 'email' queue and processes all email jobs.
 * Runs in the same process as the API server.
 *
 * Each job type maps to a specific email template.
 * Failed jobs are retried with exponential backoff (configured in queue.js).
 * Permanently failed jobs remain in Redis for inspection.
 */

const { Worker, UnrecoverableError } = require('bullmq');
const {
  getBullMQConnection,
  QUEUE_NAMES,
  EMAIL_JOBS,
} = require('../config/queue');
const {
  sendEmail,
  sendCredentialsEmail,
  sendPasswordResetOtpEmail,
  sendLeaseExpiryEmail,
  sendPaymentReceiptEmail,
  sendWelcomeEmail,
} = require('../utils/email');
const logger = require('../config/logger');

// ─── Job Processors ──────────────────────────────────────────────────────────

const processors = {
  /**
   * Send temporary login credentials to a newly created user.
   * Data: { to, name, role, password }
   */
  [EMAIL_JOBS.SEND_CREDENTIALS]: async (job) => {
    const { to, name, role, password } = job.data;
    if (!to || !name || !role || !password) {
      throw new UnrecoverableError('Missing required fields for credentials email — job will not retry');
    }
    await sendCredentialsEmail(to, name, role, password);
    return { sent: true, to };
  },

  /**
   * Send a 6-digit OTP for password reset.
   * Data: { to, name, otp, ttlMinutes }
   */
  [EMAIL_JOBS.SEND_OTP]: async (job) => {
    const { to, name, otp, ttlMinutes } = job.data;
    if (!to || !otp) {
      throw new UnrecoverableError('Missing required fields for OTP email — job will not retry');
    }
    await sendPasswordResetOtpEmail(to, name, otp, ttlMinutes || 10);
    return { sent: true, to };
  },

  /**
   * Send a lease expiry notification.
   * Data: { to, name, expiryDate }
   */
  [EMAIL_JOBS.SEND_LEASE_EXPIRY]: async (job) => {
    const { to, name, expiryDate } = job.data;
    if (!to) {
      throw new UnrecoverableError('Missing recipient for lease expiry email — job will not retry');
    }
    await sendLeaseExpiryEmail(to, name, expiryDate);
    return { sent: true, to };
  },

  /**
   * Send a payment receipt.
   * Data: { to, name, amount, date }
   */
  [EMAIL_JOBS.SEND_PAYMENT_RECEIPT]: async (job) => {
    const { to, name, amount, date } = job.data;
    if (!to) {
      throw new UnrecoverableError('Missing recipient for payment receipt email — job will not retry');
    }
    await sendPaymentReceiptEmail(to, name, amount, date);
    return { sent: true, to };
  },

  /**
   * Send a welcome email (self-registration).
   * Data: { to, name }
   */
  [EMAIL_JOBS.SEND_WELCOME]: async (job) => {
    const { to, name } = job.data;
    if (!to) {
      throw new UnrecoverableError('Missing recipient for welcome email — job will not retry');
    }
    await sendWelcomeEmail(to, name);
    return { sent: true, to };
  },
};

// ─── Worker ──────────────────────────────────────────────────────────────────

let emailWorker = null;

const startEmailWorker = () => {
  emailWorker = new Worker(
    QUEUE_NAMES.EMAIL,

    // Main processor function — dispatches to the right handler by job name
    async (job) => {
      const processor = processors[job.name];

      if (!processor) {
        throw new UnrecoverableError(`Unknown email job type: ${job.name} — job will not retry`);
      }

      logger.debug({ jobId: job.id, jobName: job.name, to: job.data?.to }, 'Processing email job');
      return processor(job);
    },

    {
      connection: getBullMQConnection(),
      concurrency: 5,          // process up to 5 emails simultaneously
      limiter: {
        max: 20,               // max 20 jobs per duration window
        duration: 1000,        // per second — respects SMTP rate limits
      },
    }
  );

  // ─── Worker Events ─────────────────────────────────────────────────────────

  emailWorker.on('completed', (job, result) => {
    logger.info(
      { jobId: job.id, jobName: job.name, to: result?.to },
      'Email job completed'
    );
  });

  emailWorker.on('failed', (job, err) => {
    const isFinal = job.attemptsMade >= (job.opts?.attempts || 3);
    logger[isFinal ? 'error' : 'warn'](
      {
        jobId: job.id,
        jobName: job.name,
        attempt: job.attemptsMade,
        maxAttempts: job.opts?.attempts,
        err: err.message,
      },
      isFinal ? 'Email job permanently failed' : 'Email job failed — will retry'
    );
  });

  emailWorker.on('error', (err) => {
    logger.error({ err }, 'Email worker error');
  });

  emailWorker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'Email job stalled — will be re-queued');
  });

  logger.info({ queue: QUEUE_NAMES.EMAIL, concurrency: 5 }, 'Email worker started');
  return emailWorker;
};

const stopEmailWorker = async () => {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    logger.info('Email worker stopped');
  }
};

module.exports = { startEmailWorker, stopEmailWorker };