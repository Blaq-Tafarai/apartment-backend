'use strict';

const prisma = require('../../database/prisma/client');

class LeaseRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.lease.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.lease.count({ where });
  }

  async findById(id) {
    return prisma.lease.findUnique({
      where: { id: parseInt(id) },
      include: {
        apartment: {
          include: {
            building: true,
            tenant: true,
          },
        },
        tenant: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.lease.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.lease.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.lease.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.lease.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new LeaseRepository();

