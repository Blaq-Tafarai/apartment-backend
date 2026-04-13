'use strict';

const prisma = require('../../database/prisma/client');

class TenantRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.tenant.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { updatedAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.tenant.count({ where });
  }

  async findById(id) {
    return prisma.tenant.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        apartment: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.tenant.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.tenant.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.tenant.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.tenant.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new TenantRepository();
