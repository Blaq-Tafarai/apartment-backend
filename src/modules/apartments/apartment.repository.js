'use strict';

// prisma passed from controller via req.prisma or service param
// Remove global import

class ApartmentRepository {
  
  /**
   * All methods now accept prisma client as first param
   * @param {PrismaClient} prisma 
   */
  
  async findMany(prisma, options) {
    const { skip, take, where, orderBy, include } = options;
    
    return prisma.apartment.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  async count(prisma, where) {
    return prisma.apartment.count({ where });
  }

  async findById(prisma, id) {
    return prisma.apartment.findUnique({
      where: { id: parseInt(id) },
      include: {
        building: true,
        tenant: {
          include: { user: true },
        },
        leases: true,
      },
    });
  }

  async findByUid(prisma, uid) {
    return prisma.apartment.findUnique({
      where: { uid },
    });
  }

  async create(prisma, data) {
    return prisma.apartment.create({
      data,
    });
  }

  async update(prisma, id, data) {
    return prisma.apartment.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(prisma, id) {
    return prisma.apartment.delete({
      where: { id: parseInt(id) },
    });
  }
}

module.exports = new ApartmentRepository();
