'use strict';

const path = require('path');
const databaseConfig = require(path.resolve(process.cwd(), 'src/config/database'));
const utilsPath = path.resolve(process.cwd(), 'src/utils/uid');
const { uid } = require(utilsPath);

/**
 * Subscription Repository - Fixed with absolute paths
 */
class SubscriptionRepository {
  constructor() {
    this.prisma = null;
  }

  getPrisma(companyId) {
    if (!this.prisma) {
      this.prisma = databaseConfig.getPrismaClient(companyId || 1);
    }
    return this.prisma;
  }

  async create(data, companyId) {
    const uidStr = uid('sub_');
    return this.getPrisma(companyId).subscription.create({
      data: { ...data, uid: uidStr },
    });
  }

  async findById(id) {
    return this.getPrisma(1).subscription.findUnique({ where: { id: parseInt(id) } });
  }

  async findByUid(uid) {
    return this.getPrisma(1).subscription.findUnique({ where: { uid } });
  }

  async findByCompany(companyId, pagination = {}) {
    const { skip = 0, take = 10 } = pagination;
    return this.getPrisma(companyId).subscription.findMany({
      where: { companyId: parseInt(companyId) },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id, data) {
    return this.getPrisma(1).subscription.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return this.getPrisma(1).subscription.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new SubscriptionRepository();

