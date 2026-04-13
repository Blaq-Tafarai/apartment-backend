const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const env    = require('./config/env');
const { createBullBoardRouter } = require('./queues/bullboard');
const logger = require('./config/logger');
const healthRoutes = require('./health/health.routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/error.middleware');
const { defaultLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.APP_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Performance ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── HTTP Request Logging ────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
app.use(defaultLimiter);

// ─── Swagger / OpenAPI ───────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Apartment Bookings API',
      version: '1.0.0',
      description: [
        'Multi-tenant property management system REST API.',
        '',
        '## Authentication',
        'All protected endpoints require a Bearer JWT in the `Authorization` header.',
        '',
        '## First-Login Flow',
        'When a user is created by an admin (admin, manager, or tenant accounts), a secure',
        'temporary password is auto-generated and emailed to them. On first login the response',
        'will include `mustChangePassword: true`. The frontend **must** redirect the user to',
        '`PUT /api/v1/auth/change-password` before granting access to anything else.',
        'Attempting to call any other endpoint while `mustChangePassword` is `true` will return',
        'a `403 PASSWORD_CHANGE_REQUIRED` error.',
      ].join('\n'),
      contact: { name: 'API Support', email: 'support@apartmentbookings.com' },
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local development' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from POST /api/v1/auth/login',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'string', example: 'NOT_FOUND' },
            message: { type: 'string' },
          },
        },
        PasswordChangeRequired: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'string', example: 'PASSWORD_CHANGE_REQUIRED' },
            message: {
              type: 'string',
              example:
                'You must change your temporary password before accessing this resource. Please call PUT /api/v1/auth/change-password.',
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        PasswordChangeRequired: {
          description: 'User must change their temporary password before continuing',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PasswordChangeRequired' } },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Service health checks' },
      { name: 'Auth', description: 'Authentication — login, register, refresh, logout, change-password' },
      { name: 'Organizations', description: 'Organization management (Superadmin only)' },
      { name: 'Subscriptions', description: 'Subscription plans (Superadmin only)' },
      { name: 'Licenses', description: 'License management (Superadmin only)' },
      { name: 'Users', description: 'User management — create sends credentials by email' },
      { name: 'Buildings', description: 'Building management' },
      { name: 'Apartments', description: 'Apartment management' },
      { name: 'Tenants', description: 'Tenant management — create sends credentials by email' },
      { name: 'Leases', description: 'Lease management' },
      { name: 'Billings', description: 'Billing records' },
      { name: 'Payments', description: 'Payment recording' },
      { name: 'Maintenances', description: 'Maintenance requests' },
      { name: 'Documents', description: 'Document upload (Cloudinary)' },
      { name: 'Expenses', description: 'Building expenses' },
      { name: 'Invoices', description: 'Invoice PDF generation' },
      { name: 'Reports', description: 'Analytics and reporting' },
      { name: 'AuditLogs', description: 'Audit trail' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js', './src/health/*.routes.js'],
});

app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Apartment Bookings API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: { persistAuthorization: true },
  })
);

app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Health (no auth required) ───────────────────────────────────────────────
app.use('/health', healthRoutes);

// ─── Root ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'Apartment Bookings API',
    version: '1.0.0',
    docs: '/api/v1/docs',
    health: '/health',
  });
});

// ─── Bull Board — Queue monitoring UI (Basic Auth protected) ─────────────────
const { basicAuthMiddleware: bullBoardAuth, router: bullBoardRouter } = createBullBoardRouter();
app.use('/api/v1/queues', bullBoardAuth, bullBoardRouter);

// ─── Auth routes (login, register, refresh, logout, change-password) ─────────
// These are mounted BEFORE the mustChangePassword guard so that:
//   - Unauthenticated users can still login
//   - Users with mustChangePassword=true can still call change-password
const authRoutes = require('./modules/auth/auth.routes');
app.use('/api/v1/auth', authRoutes);

// ─── mustChangePassword guard ────────────────────────────────────────────────
// Applied to ALL routes below this point.
// Any authenticated user with mustChangePassword=true is blocked until they
// call PUT /api/v1/auth/change-password.
const { authenticate } = require('./middleware/auth.middleware');
const { requirePasswordChanged } = require('./middleware/mustChangePassword.middleware');
const { requireActiveSubscription } = require('./middleware/subscription.middleware');
const { auditLog } = require('./middleware/auditLog.middleware');

app.use('/api/v1', (req, res, next) => {
  // Only enforce on authenticated requests
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  // Run authenticate → mustChangePassword guard → subscription check
  authenticate(req, res, (err) => {
    if (err) return next(err);
    requirePasswordChanged(req, res, (err2) => {
      if (err2) return next(err2);
      requireActiveSubscription(req, res, next);
    });
  });
});

// ─── Auto audit log (all mutating requests: POST, PUT, PATCH, DELETE) ────────
app.use('/api/v1', auditLog);

// ─── All other versioned module routes ───────────────────────────────────────
const organizationRoutes  = require('./modules/organizations/organizations.routes');
const subscriptionRoutes  = require('./modules/subscriptions/subscriptions.routes');
const licenseRoutes       = require('./modules/licenses/licenses.routes');
const userRoutes          = require('./modules/users/users.routes');
const buildingRoutes      = require('./modules/buildings/buildings.routes');
const apartmentRoutes     = require('./modules/apartments/apartments.routes');
const tenantRoutes        = require('./modules/tenants/tenants.routes');
const leaseRoutes         = require('./modules/leases/leases.routes');
const billingRoutes       = require('./modules/billings/billings.routes');
const paymentRoutes       = require('./modules/payments/payments.routes');
const maintenanceRoutes   = require('./modules/maintenances/maintenances.routes');
const documentRoutes      = require('./modules/documents/documents.routes');
const expenseRoutes       = require('./modules/expenses/expenses.routes');
const invoiceRoutes       = require('./modules/invoices/invoices.routes');
const reportRoutes        = require('./modules/reports/reports.routes');
const auditLogRoutes      = require('./modules/audit-logs/audit-logs.routes');

app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/licenses',      licenseRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/buildings',     buildingRoutes);
app.use('/api/v1/apartments',    apartmentRoutes);
app.use('/api/v1/tenants',       tenantRoutes);
app.use('/api/v1/leases',        leaseRoutes);
app.use('/api/v1/billings',      billingRoutes);
app.use('/api/v1/payments',      paymentRoutes);
app.use('/api/v1/maintenances',  maintenanceRoutes);
app.use('/api/v1/documents',     documentRoutes);
app.use('/api/v1/expenses',      expenseRoutes);
app.use('/api/v1/invoices',      invoiceRoutes);
app.use('/api/v1/reports',       reportRoutes);
app.use('/api/v1/audit-logs',    auditLogRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;