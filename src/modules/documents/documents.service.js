const prisma = require('../../database/prisma/client');
const cloudinary = require('../../config/storage');
const { AppError } = require('../../middleware/error.middleware');
const { getPaginationArgs, buildPaginatedResponse, getOrderByArgs } = require('../../utils/pagination');

const include = {
  uploadedBy: { select: { id: true, name: true, email: true } },
  apartment: { select: { id: true, unitNumber: true } },
  tenant: { include: { user: { select: { id: true, name: true } } } },
};

const list = async (query, orgFilter, user) => {
  const { skip, take, page, limit } = getPaginationArgs(query);
  const orderBy = getOrderByArgs(query, ['createdAt', 'fileName']) || { createdAt: 'desc' };
  const where = { ...orgFilter, deletedAt: null };

  if (query.apartmentId) where.apartmentId = query.apartmentId;
  if (query.tenantId) where.tenantId = query.tenantId;
  if (query.fileType) where.fileType = query.fileType;

  // Tenant only sees their own documents
  if (user?.role === 'tenant') {
    const tenant = await prisma.tenant.findFirst({ where: { userId: user.id } });
    if (tenant) where.tenantId = tenant.id;
  }

  const [data, total] = await Promise.all([
    prisma.document.findMany({ where, skip, take, orderBy, include }),
    prisma.document.count({ where }),
  ]);
  return buildPaginatedResponse(data, total, page, limit);
};

const getById = async (id, orgFilter) => {
  const item = await prisma.document.findFirst({
    where: { id, ...orgFilter, deletedAt: null },
    include,
  });
  if (!item) throw new AppError('Document not found.', 404, 'NOT_FOUND');
  return item;
};

/**
 * Upload a file to Cloudinary and save document record.
 * @param {Object} file - multer file object
 * @param {Object} body - { apartmentId, tenantId, fileType }
 * @param {string} uploadedById - user ID
 * @param {string} organizationId
 */
const upload = async (file, body, uploadedById, organizationId) => {
  if (!file) throw new AppError('No file provided.', 400, 'BAD_REQUEST');

  // Upload buffer to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `apartment-bookings/${organizationId}`,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(new AppError('File upload failed.', 500, 'UPLOAD_ERROR'));
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  return prisma.document.create({
    data: {
      uploadedById,
      organizationId,
      apartmentId: body.apartmentId || null,
      tenantId: body.tenantId || null,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileName: file.originalname,
      fileType: body.fileType || 'other',
    },
    include,
  });
};

const remove = async (id, orgFilter) => {
  const doc = await getById(id, orgFilter);

  // Delete from Cloudinary
  if (doc.publicId) {
    await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'auto' }).catch(() => {});
  }

  return prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, getById, upload, remove };