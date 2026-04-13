const prisma = require('../database/prisma/client');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');

const check = async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check DB
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'ok';
  } catch (err) {
    health.services.database = 'error';
    health.status = 'degraded';
    logger.warn({ err }, 'Health: database check failed');
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.services.redis = 'ok';
  } catch (err) {
    health.services.redis = 'error';
    health.status = 'degraded';
    logger.warn({ err }, 'Health: redis check failed');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(health);
};

const ping = (req, res) => res.json({ status: 'ok', message: 'pong' });

module.exports = { check, ping };