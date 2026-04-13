'use strict';

const prisma = require('../../database/prisma/client');
const { generateUid } = require('../../utils/uid');

class ReportRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy } = options;
    
    return prisma.report.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async findById(id) {
    return prisma.report.findUnique({
      where: { id: parseInt(id) },
    });
  }

  async create(data) {
    return prisma.report.create({
      data: {
        ...data,
        uid: generateUid('report'),
      },
    });
  }

  async update(id, data) {
    return prisma.report.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.report.delete({
      where: { id: parseInt(id) },
    });
  }

  async count(where) {
    return prisma.report.count({ where });
  }
}

module.exports = new ReportRepository();

