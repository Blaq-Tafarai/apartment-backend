'use strict';

const prisma = require('../../database/prisma/client');

class AuditLogRepository {
  
  async create(data) {
    return prisma.auditLog.create({
      data,
    });
  }

  async findMany(options) {
    const { skip, take, where, orderBy } = options;
    
    return prisma.auditLog.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
    });
  }

  async count(where) {
    return prisma.auditLog.count({ where });
  }
}

module.exports = new AuditLogRepository();
