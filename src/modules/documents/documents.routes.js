const express = require('express');
const multer = require('multer');
const router = express.Router();
const ctrl = require('./documents.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');
const { uploadLimiter } = require('../../middleware/rateLimit.middleware');

// Use memory storage; we stream the buffer to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP, and PDF files are allowed.'));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document upload and management (Cloudinary)
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/documents:
 *   get:
 *     summary: List documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: apartmentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [lease_agreement, id_document, proof_of_income, inspection_report, other]
 *     responses:
 *       200:
 *         description: Paginated document list
 */
router.get('/', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.list);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document record
 *       404:
 *         description: Not found
 */
router.get('/:id', authorize('superadmin', 'admin', 'manager', 'tenant'), ctrl.getById);

/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     summary: Upload a document to Cloudinary
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               apartmentId:
 *                 type: string
 *                 format: uuid
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *               fileType:
 *                 type: string
 *                 enum: [lease_agreement, id_document, proof_of_income, inspection_report, other]
 *     responses:
 *       201:
 *         description: Document uploaded
 *       400:
 *         description: No file provided
 */
router.post(
  '/upload',
  authorize('superadmin', 'admin', 'manager', 'tenant'),
  uploadLimiter,
  upload.single('file'),
  ctrl.upload
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Delete a document (also removes from Cloudinary)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.delete('/:id', authorize('superadmin', 'admin', 'manager'), ctrl.remove);

module.exports = router;