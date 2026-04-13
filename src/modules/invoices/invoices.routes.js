const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { managerOrAbove } = require('../../middleware/role.middleware');
const { scopeOrganization } = require('../../middleware/organization.middleware');
const { generateInvoicePDF } = require('../../utils/pdf');
const prisma = require('../../database/prisma/client');
const { AppError } = require('../../middleware/error.middleware');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice / PDF generation for billing records
 */

router.use(authenticate, scopeOrganization);

/**
 * @swagger
 * /api/v1/invoices/{billingId}/pdf:
 *   get:
 *     summary: Download invoice PDF for a billing record
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billingId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Billing record not found
 */
router.get(
  '/:billingId/pdf',
  authorize_inline(['superadmin', 'admin', 'manager', 'tenant']),
  async (req, res, next) => {
    try {
      const { billingId } = req.params;

      const billing = await prisma.billing.findFirst({
        where: { id: billingId, ...req.orgFilter, deletedAt: null },
        include: {
          tenant: { include: { user: { select: { name: true, email: true } } } },
          lease: { select: { id: true, rentAmount: true } },
        },
      });

      if (!billing) throw new AppError('Billing record not found.', 404, 'NOT_FOUND');

      const pdfBuffer = await generateInvoicePDF({
        id: billing.id,
        tenantName: billing.tenant?.user?.name || 'N/A',
        dueDate: billing.dueDate.toDateString(),
        amount: billing.amount,
        status: billing.status,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${billingId}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
);

// Inline role guard helper (avoids circular dep)
function authorize_inline(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden.', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

module.exports = router;