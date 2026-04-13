'use strict';

const prisma = require('../../database/prisma/client');

class DocumentRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.document.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { uploadedAt: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.document.count({ where });
  }

  async findById(id) {
    return prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: {
        apartment: {
          include: {
            building: true,
          },
        },
        tenant: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.document.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.document.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.document.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.document.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new DocumentRepository();
