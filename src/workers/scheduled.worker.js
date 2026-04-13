/**
 * src/workers/scheduled.worker.js
 *
 * BullMQ worker for scheduled (repeatable) jobs.
 * Processes jobs registered in src/queues/scheduled.queue.js.
 *
 * Unlike setInterval-based crons:
 * - Jobs survive server restarts (state in Redis)
 * - Missed jobs are re-queued automatically
 * - Job history is inspectable via Bull Board
 * - Concurrency and rate limiting are built-in
 */

const { Worker, UnrecoverableError } = require('bullmq');
const { getBullMQConnection, QUEUE_NAMES, SCHEDULED_JOBS } = require('../config/queue');
const prisma = require('../database/prisma/client');
const logger = require('../config/logger');

// ─── Job Implementations ─────────────────────────────────────────────────────

/**
 * Mark active leases whose endDate has passed as 'expired'.
 * Also releases the linked apartment back to 'available'.
 * Uses a Prisma transaction for atomicity.
 */
const markExpiredLeases = async () => {
  const now = new Date();

  const expiredLeases = await prisma.lease.findMany({
    where: { status: 'active', endDate: { lt: now }, deletedAt: null },
    select: { id: true, apartmentId: true },
  });

  if (expiredLeases.length === 0) {
    return { processed: 0 };
  }

  const leaseIds     = expiredLeases.map((l) => l.id);
  const apartmentIds = [...new Set(expiredLeases.map((l) => l.apartmentId))];

  await prisma.$transaction([
    prisma.lease.updateMany({
      where: { id: { in: leaseIds } },
      data: { status: 'expired' },
    }),
    prisma.apartment.updateMany({
      where: {
        id: { in: apartmentIds },
        // Only free apartments that have no other active lease
        leases: { none: { status: 'active', deletedAt: null } },
      },
      data: { status: 'available' },
    }),
  ]);

  logger.info({ count: leaseIds.length }, 'Scheduled: marked leases expired');
  return { processed: leaseIds.length };
};

/**
 * Mark pending billing records whose dueDate has passed as 'overdue'.
 */
const markOverdueBillings = async () => {
  const result = await prisma.billing.updateMany({
    where: { status: 'pending', dueDate: { lt: new Date() }, deletedAt: null },
    data: { status: 'overdue' },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Scheduled: marked billings overdue');
  }

  return { processed: result.count };
};

/**
 * Delete OTP records that are either used or expired more than 1 hour ago.
 * Prevents unbounded growth of the password_reset_otps table.
 */
const cleanupExpiredOtps = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.passwordResetOtp.deleteMany({
    where: {
      OR: [
        { usedAt: { not: null } },
        { expiresAt: { lt: oneHourAgo } },
      ],
    },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Scheduled: cleaned up expired OTPs');
  }

  return { deleted: result.count };
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const processors = {
  [SCHEDULED_JOBS.MARK_EXPIRED_LEASES]:   markExpiredLeases,
  [SCHEDULED_JOBS.MARK_OVERDUE_BILLINGS]: markOverdueBillings,
  [SCHEDULED_JOBS.CLEANUP_EXPIRED_OTPS]:  cleanupExpiredOtps,
};

// ─── Worker ──────────────────────────────────────────────────────────────────

let scheduledWorker = null;

const startScheduledWorker = () => {
  scheduledWorker = new Worker(
    QUEUE_NAMES.SCHEDULED,

    async (job) => {
      const processor = processors[job.name];

      if (!processor) {
        throw new UnrecoverableError(`Unknown scheduled job: ${job.name}`);
      }

      const start = Date.now();
      logger.info({ jobId: job.id, jobName: job.name }, 'Scheduled job started');

      const result = await processor(job);

      logger.info(
        { jobId: job.id, jobName: job.name, durationMs: Date.now() - start, result },
        'Scheduled job completed'
      );

      return result;
    },

    {
      connection: getBullMQConnection(),
      concurrency: 1, // scheduled jobs run one at a time to avoid DB contention
    }
  );

  scheduledWorker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, jobName: job?.name, attempt: job?.attemptsMade, err: err.message },
      'Scheduled job failed'
    );
  });

  scheduledWorker.on('error', (err) => {
    logger.error({ err }, 'Scheduled worker error');
  });

  logger.info({ queue: QUEUE_NAMES.SCHEDULED }, 'Scheduled worker started');
  return scheduledWorker;
};

const stopScheduledWorker = async () => {
  if (scheduledWorker) {
    await scheduledWorker.close();
    scheduledWorker = null;
    logger.info('Scheduled worker stopped');
  }
};

module.exports = {
  startScheduledWorker,
  stopScheduledWorker,
  // Exported for testing
  markExpiredLeases,
  markOverdueBillings,
  cleanupExpiredOtps,
};