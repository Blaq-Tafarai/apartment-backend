'use strict';

const prisma = require('../../database/prisma/client');

class BuildingRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.building.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.building.count({ where });
  }

  async findById(id) {
    return prisma.building.findUnique({
      where: { id: parseInt(id) },
      include: {
        organization: {
          select: { id: true, uid: true, name: true },
        },
        apartments: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.building.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.building.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.building.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.building.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new BuildingRepository();
