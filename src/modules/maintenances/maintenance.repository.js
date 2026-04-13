'use strict';

const prisma = require('../../database/prisma/client');

class MaintenanceRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.maintenance.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.maintenance.count({ where });
  }

  async findById(id) {
    return prisma.maintenance.findUnique({
      where: { id: parseInt(id) },
      include: {
        apartment: {
          include: {
            building: true,
            tenant: true,
          },
        },
        tenant: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async findByUid(uid) {
    return prisma.maintenance.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.maintenance.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.maintenance.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.maintenance.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new MaintenanceRepository();

