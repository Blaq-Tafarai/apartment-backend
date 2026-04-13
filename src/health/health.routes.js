const express = require('express');
const router = express.Router();
const ctrl = require('./health.controller');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Service health checks
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Full health check (DB + Redis)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services healthy
 *       503:
 *         description: One or more services degraded
 */
router.get('/', ctrl.check);

/**
 * @swagger
 * /health/ping:
 *   get:
 *     summary: Simple ping
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: pong
 */
router.get('/ping', ctrl.ping);

module.exports = router;