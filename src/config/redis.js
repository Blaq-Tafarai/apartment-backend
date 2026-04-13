const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error({ err }, 'Redis error'));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
};

const connectRedis = async () => {
  const client = getRedisClient();
  await client.connect();
  return client;
};

module.exports = { getRedisClient, connectRedis };