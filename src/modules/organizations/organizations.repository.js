'use strict';

const prisma = require('../../database/prisma/client');

/**
 * Company Repository
 */
class OrganizationRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.organization.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.organization.count({ where });
  }

  async findById(id) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, uid: true, name: true, email: true, role: true },
        },
        buildings: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.organization.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.organization.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.organization.delete({
      where: { id },
    });
  }
}

module.exports = new OrganizationRepository();

