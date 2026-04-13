'use strict';

const z = require('zod');

const createReportSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['OCCUPANCY', 'FINANCIAL', 'MAINTENANCE', 'TENANT']),
  schedule: z.string().optional(),
  params: z.object({}).passthrough().optional(),
});

const updateReportSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['OCCUPANCY', 'FINANCIAL', 'MAINTENANCE', 'TENANT']).optional(),
  schedule: z.string().optional(),
  params: z.object({}).passthrough().optional(),
});

const paramSchema = z.object({
  id: z.string().optional(),
});

module.exports = {
  createReportSchema,
  updateReportSchema,
  paramSchema,
};

