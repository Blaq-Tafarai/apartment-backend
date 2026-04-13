'use strict';

const prisma = require('../../database/prisma/client');

class ExpenseRepository {
  
  async findMany(options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.expense.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { date: 'desc' },
      include,
    });
  }

  async count(where) {
    return prisma.expense.count({ where });
  }

  async findById(id) {
    return prisma.expense.findUnique({
      where: { id: parseInt(id) },
      include: {
        apartment: {
          include: {
            building: true,
          },
        },
      },
    });
  }

  async findByUid(uid) {
    return prisma.expense.findUnique({
      where: { uid },
    });
  }

  async create(data) {
    return prisma.expense.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.expense.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.expense.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new ExpenseRepository();

