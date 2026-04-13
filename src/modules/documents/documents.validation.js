'use strict';

const { z } = require('zod');

const documentIdParam = z.object({
  id: z.string().regex(/^\d+$/, 'Valid document ID required'),
});

const createDocumentBody = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['lease', 'invoice', 'other']),
  description: z.string().optional(),
  tenantId: z.string().regex(/^\d+$/).optional(),
  buildingId: z.string().regex(/^\d+$/).optional(),
  apartmentId: z.string().regex(/^\d+$/).optional(),
  file: z.string().min(1, 'File path required'), // backend path, <10MB check app-side
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
}).refine(data => data.tenantId || data.buildingId || data.apartmentId, 'At least one relation required');

const updateDocumentBody = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['LEASE_AGREEMENT', 'ID_PROOF', 'BANK_DETAILS', 'MAINTENANCE_REPORT', 'INSPECTION']).optional(),
  filePath: z.string().url().optional(),
});

module.exports = {
  documentIdParam,
  createDocumentBody,
  updateDocumentBody,
};
