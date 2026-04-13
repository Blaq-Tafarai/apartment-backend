/**
 * src/queues/bullboard.js
 *
 * Bull Board queue monitoring UI.
 * Accessible at: GET /api/v1/queues
 *
 * Protected by HTTP Basic Auth in production.
 * In development it is open (configure BULL_BOARD_USER + BULL_BOARD_PASS in .env).
 *
 * Features:
 *  - Live view of email and scheduled queues
 *  - Inspect job data, logs, stacktraces
 *  - Retry / delete failed jobs manually
 *  - View repeatable job schedules
 */

const { createBullBoard }  = require('@bull-board/api');
const { BullMQAdapter }    = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter }   = require('@bull-board/express');
const { getAllQueues }      = require('./index');
const env                  = require('../config/env');
const logger               = require('../config/logger');

/**
 * Build the Bull Board Express router.
 * Returns an Express router — mount it in app.js.
 */
const createBullBoardRouter = () => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/api/v1/queues');

  createBullBoard({
    queues: getAllQueues().map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  const router = serverAdapter.getRouter();

  // ── HTTP Basic Auth guard ──────────────────────────────────────────────────
  // Wraps the Bull Board router with basic auth so it is not publicly accessible.
  // In development both values default to 'admin' if not set in .env.
  const BOARD_USER = env.BULL_BOARD_USER || 'admin';
  const BOARD_PASS = env.BULL_BOARD_PASS || 'admin';

  if (env.NODE_ENV === 'production' && (!env.BULL_BOARD_USER || !env.BULL_BOARD_PASS)) {
    logger.warn(
      'BULL_BOARD_USER / BULL_BOARD_PASS not set — Bull Board is using default credentials in production!'
    );
  }

  // Express middleware that enforces basic auth before passing to Bull Board
  const basicAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const [type, encoded] = authHeader.split(' ');

    if (type !== 'Basic' || !encoded) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      return res.status(401).send('Authentication required');
    }

    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');

    if (user !== BOARD_USER || pass !== BOARD_PASS) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      return res.status(401).send('Invalid credentials');
    }

    return next();
  };

  logger.info('Bull Board mounted at /api/v1/queues');

  return { basicAuthMiddleware, router };
};

module.exports = { createBullBoardRouter };