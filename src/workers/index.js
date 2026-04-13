/**
 * src/workers/index.js
 *
 * Central registry for all BullMQ workers.
 * Called from server.js on startup and graceful shutdown.
 */

const { startEmailWorker, stopEmailWorker }         = require('./email.worker');
const { startScheduledWorker, stopScheduledWorker } = require('./scheduled.worker');
const logger = require('../config/logger');

/**
 * Start all workers.
 * Call after Redis is connected.
 */
const startAllWorkers = () => {
  startEmailWorker();
  startScheduledWorker();
  logger.info('All BullMQ workers started');
};

/**
 * Gracefully stop all workers.
 * Workers finish in-progress jobs before closing.
 * Call before closeAllQueues() on shutdown.
 */
const stopAllWorkers = async () => {
  await Promise.allSettled([
    stopEmailWorker(),
    stopScheduledWorker(),
  ]);
  logger.info('All BullMQ workers stopped');
};

module.exports = { startAllWorkers, stopAllWorkers };