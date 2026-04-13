/**
 * src/queues/scheduled.queue.js
 *
 * Scheduled (repeatable) jobs queue.
 * Sets up BullMQ repeatable jobs using cron expressions.
 * The actual job logic lives in src/workers/scheduled.worker.js.
 *
 * BullMQ repeatable jobs are stored in Redis and survive server restarts —
 * unlike setInterval which is lost when the process dies.
 */

const { Queue } = require('bullmq');
const { getBullMQConnection, DEFAULT_JOB_OPTIONS, QUEUE_NAMES, SCHEDULED_JOBS } = require('../config/queue');
const logger = require('../config/logger');

let scheduledQueue = null;

const getScheduledQueue = () => {
  if (!scheduledQueue) {
    scheduledQueue = new Queue(QUEUE_NAMES.SCHEDULED, {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        attempts: 3,
        removeOnComplete: { count: 10, age: 3600 }, // only need recent history for scheduled jobs
        removeOnFail: { count: 50, age: 7 * 24 * 3600 },
      },
    });

    scheduledQueue.on('error', (err) => {
      logger.error({ err, queue: QUEUE_NAMES.SCHEDULED }, 'Scheduled queue error');
    });
  }
  return scheduledQueue;
};

/**
 * Register all repeatable (cron-based) jobs.
 * Safe to call multiple times — BullMQ deduplicates by jobId.
 * Call once on application startup after Redis is connected.
 */
const registerRepeatableJobs = async () => {
  const queue = getScheduledQueue();

  const jobs = [
    {
      name: SCHEDULED_JOBS.MARK_EXPIRED_LEASES,
      cron: '0 * * * *',          // every hour at :00
      jobId: 'mark-expired-leases-cron',
      description: 'Mark expired leases and free apartments',
    },
    {
      name: SCHEDULED_JOBS.MARK_OVERDUE_BILLINGS,
      cron: '5 * * * *',          // every hour at :05 (stagger with leases)
      jobId: 'mark-overdue-billings-cron',
      description: 'Mark overdue billing records',
    },
    {
      name: SCHEDULED_JOBS.CLEANUP_EXPIRED_OTPS,
      cron: '*/30 * * * *',       // every 30 minutes
      jobId: 'cleanup-expired-otps-cron',
      description: 'Delete expired/used OTP records',
    },
  ];

  for (const job of jobs) {
    await queue.add(
      job.name,
      { scheduledAt: new Date().toISOString() },
      {
        repeat: { pattern: job.cron },
        jobId: job.jobId,
        removeOnComplete: { count: 5 },
        removeOnFail: { count: 20 },
      }
    );
    logger.info({ job: job.name, cron: job.cron }, `Scheduled job registered: ${job.description}`);
  }

  logger.info('All repeatable jobs registered');
};

/**
 * Remove all repeatable jobs (useful for testing or reconfiguration).
 */
const removeRepeatableJobs = async () => {
  const queue = getScheduledQueue();
  const repeatableJobs = await queue.getRepeatableJobs();

  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key);
    logger.info({ job: job.name }, 'Repeatable job removed');
  }
};

/**
 * Manually trigger a scheduled job immediately (useful for testing).
 * @param {string} jobName - one of SCHEDULED_JOBS values
 */
const triggerJobNow = (jobName) =>
  getScheduledQueue().add(jobName, { triggeredManually: true, triggeredAt: new Date().toISOString() });

/**
 * Close the queue connection gracefully.
 */
const closeScheduledQueue = async () => {
  if (scheduledQueue) {
    await scheduledQueue.close();
    scheduledQueue = null;
    logger.info('Scheduled queue closed');
  }
};

module.exports = {
  getScheduledQueue,
  registerRepeatableJobs,
  removeRepeatableJobs,
  triggerJobNow,
  closeScheduledQueue,
};