/**
 * prisma/seed.js
 * Seeds a superadmin user and a full demo organization for bootstrapping.
 * Run: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...');

  // ── Superadmin ──────────────────────────────────────────────────────────────
  const existingSuperadmin = await prisma.user.findFirst({
    where: { email: 'superadmin@apartmentbookings.com' },
  });

  if (!existingSuperadmin) {
    const password = await bcrypt.hash('SuperAdmin@123', 12);
    const superadmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@apartmentbookings.com',
        password,
        role: 'superadmin',
        status: 'active',
        mustChangePassword: false, // seeded users never need to change password
      },
    });
    console.log(`✅  Superadmin created: ${superadmin.email}`);
  } else {
    console.log('ℹ️   Superadmin already exists — skipping');
  }

  // ── Demo Organization ──────────────────────────────────────────────────────
  const existingOrg = await prisma.organization.findFirst({
    where: { name: 'Demo Property Co.' },
  });

  if (!existingOrg) {
    // 1. Create subscription first (organizationId updated after org is created)
    const sub = await prisma.subscription.create({
      data: {
        organizationId: 'pending', // placeholder — updated below
        planName: 'Professional',
        billingCycle: 'monthly',
        price: 299.00,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    // 2. Create the organization, linked to the subscription
    const org = await prisma.organization.create({
      data: {
        name: 'Demo Property Co.',
        status: 'active',
        subscriptionId: sub.id,
      },
    });

    // 3. Back-fill the real organizationId on the subscription
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { organizationId: org.id },
    });

    // 4. Create a license for the org
    await prisma.license.create({
      data: {
        organizationId: org.id,
        subscriptionId: sub.id,
        maxUsers: 50,
        maxBuildings: 10,
        maxApartments: 200,
        features: { reportExports: true, cloudStorage: true, apiAccess: true },
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // 5. Admin user
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: 'admin@demoproperty.com',
        password: adminPassword,
        role: 'admin',
        organizationId: org.id,
        status: 'active',
        mustChangePassword: false,
      },
    });

    // 6. Building
    const building = await prisma.building.create({
      data: {
        name: 'Sunset Towers',
        address: '123 Main Street, Accra, Ghana',
        organizationId: org.id,
      },
    });

    // 7. Manager user
    const managerPassword = await bcrypt.hash('Manager@123', 12);
    const manager = await prisma.user.create({
      data: {
        name: 'Demo Manager',
        email: 'manager@demoproperty.com',
        password: managerPassword,
        role: 'manager',
        organizationId: org.id,
        status: 'active',
        mustChangePassword: false,
      },
    });

    // 8. Assign manager to building
    await prisma.managerBuilding.create({
      data: { managerId: manager.id, buildingId: building.id },
    });

    // 9. Apartments
    const apartments = await Promise.all(
      ['A101', 'A102', 'B201', 'B202'].map((unit) =>
        prisma.apartment.create({
          data: {
            unitNumber: unit,
            status: 'available',
            buildingId: building.id,
            organizationId: org.id,
          },
        })
      )
    );

    // 10. Tenant user
    const tenantPassword = await bcrypt.hash('Tenant@123', 12);
    const tenantUser = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'tenant@demoproperty.com',
        password: tenantPassword,
        role: 'tenant',
        organizationId: org.id,
        status: 'active',
        mustChangePassword: false,
      },
    });

    // 11. Tenant record linked to apartment A101
    const tenant = await prisma.tenant.create({
      data: {
        userId: tenantUser.id,
        apartmentId: apartments[0].id,
        organizationId: org.id,
      },
    });

    // 12. Mark A101 as occupied
    await prisma.apartment.update({
      where: { id: apartments[0].id },
      data: { status: 'occupied' },
    });

    // 13. Active lease for the tenant
    const lease = await prisma.lease.create({
      data: {
        apartmentId: apartments[0].id,
        tenantId: tenant.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
        rentAmount: 1200.00,
        status: 'active',
        organizationId: org.id,
      },
    });

    // 14. Pending billing record for this month
    await prisma.billing.create({
      data: {
        tenantId: tenant.id,
        leaseId: lease.id,
        amount: 1200.00,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        organizationId: org.id,
      },
    });

    // 15. Sample maintenances
    await Promise.all([
      prisma.maintenance.create({
        data: {
          apartmentId: apartments[0].id, // A101 - tenant occupied
          tenantId: tenant.id,
          category: 'plumbing',
          priority: 'high',
          description: 'Leaky faucet in kitchen - reported by tenant',
          organizationId: org.id,
          status: 'open',
        },
      }),
      prisma.maintenance.create({
        data: {
          apartmentId: apartments[1].id, // A102 - available
          assignedManagerId: manager.id,
          category: 'electrical',
          priority: 'medium',
          description: 'Faulty light fixture in living room',
          organizationId: org.id,
          status: 'in_progress',
        },
      }),
      prisma.maintenance.create({
        data: {
          apartmentId: apartments[2].id, // B201 - available
          category: 'cleaning',
          priority: 'low',
          description: 'Post-turnover deep cleaning needed before new tenant',
          organizationId: org.id,
          status: 'resolved',
        },
      }),
    ]);

    console.log('   3 sample maintenances created');

    console.log(`✅  Demo org created: ${org.name}`);
    console.log(`   Admin:   admin@demoproperty.com   / Admin@123`);
    console.log(`   Manager: manager@demoproperty.com / Manager@123`);
    console.log(`   Tenant:  tenant@demoproperty.com  / Tenant@123`);
    console.log(`   Maintenances: A101(plumbing), A102(electrical), B201(cleaning)`);
  } else {
    console.log('ℹ️   Demo org already exists — skipping');
  }

  console.log('\n🎉  Seed complete!\n');
  console.log('Default credentials:');
  console.log('  Superadmin : superadmin@apartmentbookings.com / SuperAdmin@123');
  console.log('  Admin      : admin@demoproperty.com           / Admin@123');
  console.log('  Manager    : manager@demoproperty.com         / Manager@123');
  console.log('  Tenant     : tenant@demoproperty.com          / Tenant@123');
  console.log('\nNote: All seeded users have mustChangePassword = false.');
  console.log('      Users created via the API will have mustChangePassword = true');
  console.log('      and will receive their credentials by email.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
