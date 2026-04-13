'use strict';

const prisma = require('../../database/prisma/client');

class LicenseRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy } = options;
    
    return prisma.license.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
    });
  }

  async count(where) {
    return prisma.license.count({ where });
  }

  async findById(id) {
    return prisma.license.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.license.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.license.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.license.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.license.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new LicenseRepository();
