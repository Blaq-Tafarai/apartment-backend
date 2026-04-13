/**
 * src/queues/index.js
 *
 * Central registry that exports all queue instances.
 * Used by:
 *   - Bull Board (monitoring UI)
 *   - server.js (startup / shutdown)
 *   - Any future queue additions
 */

const { getEmailQueue, closeEmailQueue }         = require('./email.queue');
const { getScheduledQueue, closeScheduledQueue } = require('./scheduled.queue');

/**
 * Returns all active queue instances.
 * Instantiates them if not already created.
 */
const getAllQueues = () => [
  getEmailQueue(),
  getScheduledQueue(),
];

/**
 * Gracefully close all queue connections.
 * Call during server shutdown AFTER stopping workers.
 */
const closeAllQueues = async () => {
  await Promise.allSettled([
    closeEmailQueue(),
    closeScheduledQueue(),
  ]);
};

module.exports = { getAllQueues, closeAllQueues };