/**
 * src/config/queue.js
 *
 * BullMQ connection configuration.
 * BullMQ requires its own IORedis connection — it cannot share the main
 * application Redis client because it uses blocking commands (BLPOP etc.).
 *
 * A separate connection config is created for:
 *   - Queue producers  (adding jobs)
 *   - Workers          (consuming jobs)
 *   - QueueEvents      (monitoring)
 */

const env = require('./env');

/**
 * Returns a fresh IORedis-compatible connection config object.
 * We pass the config object (not an IORedis instance) and let
 * BullMQ create isolated connections per Queue / Worker.
 * This avoids "NOSCRIPT" and blocking-command conflicts.
 */
const getBullMQConnection = () => {
  const url = new URL(env.REDIS_URL);

  return {
    host: url.hostname,
    port: parseInt(url.port, 10) || 6379,
    password: url.password || undefined,
    db: parseInt((url.pathname || '/0').replace('/', '') || '0', 10) || 0,
    tls: env.REDIS_TLS === 'true' ? {} : undefined,
    // These two settings are required by BullMQ workers
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  };
};

/**
 * Default BullMQ job options — applied to all queues unless overridden.
 * Production-grade: exponential backoff, bounded retention.
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s → 10s → 20s
  },
  removeOnComplete: {
    count: 100,        // keep last 100 completed jobs for debugging
    age: 24 * 3600,    // remove completed jobs after 24h
  },
  removeOnFail: {
    count: 500,        // keep last 500 failed jobs for inspection
    age: 7 * 24 * 3600,// keep failed jobs 7 days
  },
};

/**
 * Queue names — single source of truth.
 * Always import these constants; never use raw strings.
 */
const QUEUE_NAMES = {
  EMAIL:     'email',
  SCHEDULED: 'scheduled',
};

/**
 * Job type names for the email queue.
 */
const EMAIL_JOBS = {
  SEND_CREDENTIALS:     'send-credentials',
  SEND_OTP:             'send-otp',
  SEND_LEASE_EXPIRY:    'send-lease-expiry',
  SEND_PAYMENT_RECEIPT: 'send-payment-receipt',
  SEND_WELCOME:         'send-welcome',
};

/**
 * Job type names for the scheduled queue.
 */
const SCHEDULED_JOBS = {
  MARK_EXPIRED_LEASES:   'mark-expired-leases',
  MARK_OVERDUE_BILLINGS: 'mark-overdue-billings',
  CLEANUP_EXPIRED_OTPS:  'cleanup-expired-otps',
};

module.exports = {
  getBullMQConnection,
  DEFAULT_JOB_OPTIONS,
  QUEUE_NAMES,
  EMAIL_JOBS,
  SCHEDULED_JOBS,
};