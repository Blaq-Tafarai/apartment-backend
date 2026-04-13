'use strict';

const prisma = require('../../database/prisma/client');

class PaymentRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.payment.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { paymentDate: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.payment.count({ where });
  }

  async findById(id) {
    return prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        invoice: {
          include: {
            apartment: {
              include: {
                building: true,
                tenant: true,
              },
            },
          },
        },
        tenant: true,
      },
    });
  }

  async findByUid(uid) {
    return prisma.payment.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.payment.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.payment.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.payment.delete({
      where: { id: parseInt(id) },
    });
  }

  async createMany(data) {
    return prisma.payment.createMany({
      data,
    });
  }
}

module.exports = new PaymentRepository();
