/**
 * src/server.js
 *
 * Production HTTP server with full lifecycle management:
 *  1. Connect PostgreSQL (Prisma)
 *  2. Connect Redis
 *  3. Start BullMQ workers (email + scheduled)
 *  4. Register BullMQ repeatable jobs (cron schedules)
 *  5. Start HTTP server
 *  6. Graceful shutdown on SIGTERM / SIGINT
 */

const app    = require('./app');
const env    = require('./config/env');
const logger = require('./config/logger');

const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, getRedisClient }        = require('./config/redis');
const { startAllWorkers, stopAllWorkers }     = require('./workers/index');
const { registerRepeatableJobs }              = require('./queues/scheduled.queue');
const { closeAllQueues }                      = require('./queues/index');

let server;

// ─── Startup ─────────────────────────────────────────────────────────────────

const start = async () => {
  // 1. PostgreSQL
  await connectDatabase();

  // 2. Redis — BullMQ and rate-limiting both depend on this
  try {
    await connectRedis();
  } catch (err) {
    logger.error({ err }, 'Redis connection failed — cannot start without Redis (BullMQ requires it)');
    process.exit(1);
  }

  // 3. Start BullMQ workers BEFORE registering jobs so they are ready to consume
  startAllWorkers();

  // 4. Register repeatable (cron) jobs — idempotent, safe to call on every restart
  try {
    await registerRepeatableJobs();
  } catch (err) {
    // Non-fatal — log and continue, workers can still process one-off jobs
    logger.error({ err }, 'Failed to register repeatable jobs');
  }

  // 5. Start HTTP server
  server = app.listen(env.PORT, () => {
    logger.info(`🚀  Server running on http://localhost:${env.PORT}  [${env.NODE_ENV}]`);
    logger.info(`📖  API docs     → http://localhost:${env.PORT}/api/v1/docs`);
    logger.info(`📊  Queue board  → http://localhost:${env.PORT}/api/v1/queues`);
  });

  server.on('error', (err) => {
    logger.error({ err }, 'HTTP server error');
    process.exit(1);
  });
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`${signal} received — starting graceful shutdown`);

  // Stop accepting new HTTP connections
  if (server) {
    server.close(() => logger.info('HTTP server closed — no new connections'));
  }

  try {
    // Order matters:
    // 1. Stop workers first (let in-progress jobs finish)
    await stopAllWorkers();

    // 2. Close queue connections (after workers are done)
    await closeAllQueues();

    // 3. Close database
    await disconnectDatabase();

    // 4. Close main Redis client
    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
      logger.info('Redis connection closed');
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Force kill if graceful shutdown takes too long
const forceKillTimeout = (signal) => {
  setTimeout(() => {
    logger.error(`${signal}: forced shutdown after 30s timeout`);
    process.exit(1);
  }, 30_000).unref(); // .unref() so the timer doesn't keep Node alive by itself
};

process.on('SIGTERM', () => { forceKillTimeout('SIGTERM'); shutdown('SIGTERM'); });
process.on('SIGINT',  () => { forceKillTimeout('SIGINT');  shutdown('SIGINT');  });

// ─── Unhandled errors ─────────────────────────────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});

start();