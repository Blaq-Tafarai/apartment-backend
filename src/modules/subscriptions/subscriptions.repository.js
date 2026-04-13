'use strict';

const databaseConfig = require('../../../config/database');
const { uid } = require('../../../utils/uid');

/**
 * Subscription Repository - Fixed for path resolution
 */
class SubscriptionRepository {
  constructor() {
    // No prisma init at import time
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

  async findByOrganization(organizationId, pagination = {}) {
    const { skip = 0, take = 10 } = pagination;
    return this.getPrisma(organizationId).subscription.findMany({
      where: { organizationId },
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

