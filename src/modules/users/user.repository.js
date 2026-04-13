'use strict';

const prisma = require('../../database/prisma/client');

/**
 * User Repository
 */
class UserRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.user.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.user.count({ where });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        organization: {
          select: { id: true, uid: true, name: true },
        },
      },
    });
  }

  async findByUid(uid) {
    return prisma.user.findUnique({
      where: { uid },
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.user.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new UserRepository();

