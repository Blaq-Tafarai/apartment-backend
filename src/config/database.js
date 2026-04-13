const prisma = require('../database/prisma/client');
const logger = require('./logger');

const connectDatabase = async () => {
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');
};

const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
};

module.exports = { connectDatabase, disconnectDatabase };