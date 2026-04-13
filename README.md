# 🏢 Apartment Bookings Backend

A production-ready, multi-tenant **property management system** API built with Node.js, Express, Prisma, PostgreSQL, Redis, and Cloudinary.

---

## ✨ Features

- **Multi-tenancy** — all data is scoped to an organization; users only ever see their own org's data
- **Role-based access control** — `superadmin` / `admin` / `manager` / `tenant`
- **Manager scope** — managers only access buildings they are explicitly assigned to
- **JWT auth** — short-lived access tokens + rotating refresh tokens
- **Soft deletes** — all major entities support `deletedAt` for safe archiving
- **Pagination, sorting, filtering** — on every list endpoint
- **Cloudinary** — secure document file upload with buffer streaming
- **PDF generation** — invoices, lease agreements, expense reports
- **Swagger/OpenAPI** — interactive docs at `/api/v1/docs`
- **Redis** — rate limiting (degrades gracefully if Redis is down)
- **Pino** — structured JSON logging
- **Health checks** — `/health` pings the DB and Redis

---

## 🗂️ Folder Structure

```
apartment-bookings-backend/
├── prisma/
│   ├── schema.prisma           # Full DB schema
│   └── seed.js                 # Demo seed data
├── src/
│   ├── app.js                  # Express app (middleware + Swagger)
│   ├── server.js               # HTTP server + graceful shutdown
│   ├── config/                 # env, logger, redis, database, storage
│   ├── constants/              # roles, permissions, statuses, types
│   ├── database/prisma/        # Prisma client singleton
│   ├── health/                 # Health check controller + routes
│   ├── middleware/             # auth, role, org-scope, pagination, validation, rate-limit, error
│   ├── modules/
│   │   ├── auth/               # Register, login, refresh, logout, me
│   │   ├── organizations/      # Superadmin CRUD
│   │   ├── subscriptions/      # Superadmin CRUD
│   │   ├── licenses/           # Superadmin CRUD
│   │   ├── users/              # Admin CRUD + manager assignment
│   │   ├── buildings/          # Admin CRUD + manager assignment
│   │   ├── apartments/         # Admin/Manager CRUD
│   │   ├── tenants/            # Admin/Manager CRUD (auto-creates user)
│   │   ├── leases/             # Admin/Manager CRUD + terminate
│   │   ├── billings/           # Admin/Manager CRUD
│   │   ├── payments/           # All roles + auto-marks billing paid
│   │   ├── maintenances/       # All roles with scope filtering
│   │   ├── documents/          # All roles + Cloudinary upload
│   │   ├── expenses/           # Admin/Manager CRUD + summary
│   │   ├── invoices/           # PDF download for billing records
│   │   ├── reports/            # Occupancy, revenue, expenses, maintenance, leases, payments
│   │   └── audit-logs/         # Admin read-only audit trail
│   ├── routes/
│   │   ├── index.js            # Mounts v1 under /api/v1
│   │   └── v1.routes.js        # All module routes
│   └── utils/                  # pagination, password, uid, date, email, pdf, logger
├── .env.example
├── package.json
├── README.md
└── TODO.md
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd apartment-bookings-backend
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email (SMTP) credentials |

### 3. Database setup

```bash
# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data
node prisma/seed.js
```

### 4. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`

---

## 📖 API Documentation

Interactive Swagger UI: **`http://localhost:5000/api/v1/docs`**

Raw OpenAPI JSON: `http://localhost:5000/api/v1/docs.json`

---

## 🔐 Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

**Flow:**

```
POST /api/v1/auth/register   → Create account
POST /api/v1/auth/login      → Get accessToken + refreshToken
POST /api/v1/auth/refresh    → Rotate tokens using refreshToken
POST /api/v1/auth/logout     → Invalidate refresh token
GET  /api/v1/auth/me         → Get current user profile
PUT  /api/v1/auth/change-password
```

---

## 🛡️ Roles & Permissions

| Action | Superadmin | Admin | Manager | Tenant |
|--------|:---:|:---:|:---:|:---:|
| CRUD organizations | ✅ | — | — | — |
| CRUD subscriptions/licenses | ✅ | — | — | — |
| CRUD users | ✅ | ✅ | — | — |
| CRUD buildings | — | ✅ | — | — |
| CRUD apartments | — | ✅ | ✅* | — |
| CRUD tenants | — | ✅ | ✅* | — |
| CRUD leases | — | ✅ | ✅* | read | 
| CRUD billings | — | ✅ | ✅* | read |
| CRUD payments | — | ✅ | ✅* | ✅ (create) |
| CRUD maintenance | — | ✅ | ✅* | ✅ (create) |
| Upload documents | — | ✅ | ✅* | ✅ |
| CRUD expenses | — | ✅ | ✅* | — |
| View reports | — | ✅ | ✅* | — |
| Audit logs | ✅ | ✅ | — | — |

*\* Managers are scoped to their assigned buildings only.*

---

## 🌐 API Endpoints

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/change-password
```

### Organizations (Superadmin)
```
GET    /api/v1/organizations
GET    /api/v1/organizations/:id
POST   /api/v1/organizations
PUT    /api/v1/organizations/:id
DELETE /api/v1/organizations/:id
```

### Subscriptions (Superadmin)
```
GET    /api/v1/subscriptions
GET    /api/v1/subscriptions/:id
POST   /api/v1/subscriptions
PUT    /api/v1/subscriptions/:id
DELETE /api/v1/subscriptions/:id
```

### Licenses (Superadmin)
```
GET    /api/v1/licenses
GET    /api/v1/licenses/:id
POST   /api/v1/licenses
PUT    /api/v1/licenses/:id
DELETE /api/v1/licenses/:id
```

### Users (Admin)
```
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
POST   /api/v1/users/:id/assign-building
DELETE /api/v1/users/:id/unassign-building/:buildingId
```

### Buildings (Admin)
```
GET    /api/v1/buildings
GET    /api/v1/buildings/:id
POST   /api/v1/buildings
PUT    /api/v1/buildings/:id
DELETE /api/v1/buildings/:id
```

### Apartments (Admin / Manager)
```
GET    /api/v1/apartments
GET    /api/v1/apartments/:id
POST   /api/v1/apartments
PUT    /api/v1/apartments/:id
DELETE /api/v1/apartments/:id
```

### Tenants (Admin / Manager)
```
GET    /api/v1/tenants
GET    /api/v1/tenants/:id
POST   /api/v1/tenants        ← also creates a user account
PUT    /api/v1/tenants/:id
DELETE /api/v1/tenants/:id
```

### Leases (Admin / Manager)
```
GET    /api/v1/leases
GET    /api/v1/leases/:id
POST   /api/v1/leases         ← auto-marks apartment as occupied
PUT    /api/v1/leases/:id
PATCH  /api/v1/leases/:id/terminate  ← frees apartment
DELETE /api/v1/leases/:id
```

### Billings (Admin / Manager / Tenant-read)
```
GET    /api/v1/billings
GET    /api/v1/billings/:id
POST   /api/v1/billings
PUT    /api/v1/billings/:id
DELETE /api/v1/billings/:id
```

### Payments (All roles)
```
GET    /api/v1/payments
GET    /api/v1/payments/:id
POST   /api/v1/payments       ← auto-marks billing as paid
PUT    /api/v1/payments/:id
DELETE /api/v1/payments/:id
```

### Maintenances (All roles with scoping)
```
GET    /api/v1/maintenances
GET    /api/v1/maintenances/:id
POST   /api/v1/maintenances
PUT    /api/v1/maintenances/:id
DELETE /api/v1/maintenances/:id
```

### Documents (Cloudinary)
```
GET    /api/v1/documents
GET    /api/v1/documents/:id
POST   /api/v1/documents/upload   ← multipart/form-data; field: "file"
DELETE /api/v1/documents/:id      ← also deletes from Cloudinary
```

### Expenses (Admin / Manager)
```
GET    /api/v1/expenses
GET    /api/v1/expenses/summary/:buildingId
GET    /api/v1/expenses/:id
POST   /api/v1/expenses
PUT    /api/v1/expenses/:id
DELETE /api/v1/expenses/:id
```

### Invoices
```
GET    /api/v1/invoices/:billingId/pdf   ← streams PDF
```

### Reports (Admin / Manager)
```
GET    /api/v1/reports/occupancy
GET    /api/v1/reports/revenue?year=2025&month=6
GET    /api/v1/reports/expenses?year=2025&month=6
GET    /api/v1/reports/maintenance
GET    /api/v1/reports/lease-expiry?days=30
GET    /api/v1/reports/payment-summary?year=2025&month=6
```

### Audit Logs (Admin / Superadmin)
```
GET    /api/v1/audit-logs
GET    /api/v1/audit-logs/:id
```

### Health
```
GET    /health
GET    /health/ping
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `express` | HTTP framework |
| `@prisma/client` + `prisma` | ORM + migrations |
| `jsonwebtoken` | JWT access + refresh tokens |
| `bcryptjs` | Password hashing |
| `cloudinary` + `multer` | File upload |
| `ioredis` | Redis client |
| `express-rate-limit` | Rate limiting |
| `express-validator` | Input validation |
| `swagger-jsdoc` + `swagger-ui-express` | API docs |
| `pino` + `pino-pretty` | Structured logging |
| `nodemailer` | Email sending |
| `pdfkit` | PDF generation |
| `helmet` | Security headers |
| `cors` | CORS handling |
| `compression` | Response compression |

---

## 🗄️ Database Schema

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the full schema.

**Entities:** Organization · Subscription · License · User · ManagerBuilding · Building · Apartment · Tenant · Lease · Billing · Payment · Maintenance · Document · Expense · AuditLog

All entities use:
- **UUID primary keys**
- **`createdAt` / `updatedAt`** timestamps
- **`deletedAt`** for soft deletes (where applicable)
- **Indexes** on all foreign keys and frequently-queried fields

---

## 🌱 Demo Seed Credentials

After running `node prisma/seed.js`:

| Role | Email | Password |
|------|-------|----------|
| Superadmin | superadmin@apartmentbookings.com | SuperAdmin@123 |
| Admin | admin@demoproperty.com | Admin@123 |
| Manager | manager@demoproperty.com | Manager@123 |
| Tenant | tenant@demoproperty.com | Tenant@123 |

---

## 🐳 Docker (Coming Soon)

See `TODO.md` — Dockerfile and docker-compose are planned.

---

## 📝 License

MIT