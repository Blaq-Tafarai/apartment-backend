const prisma = require('../database/prisma/client');
const { AppError } = require('./error.middleware');

/**
 * Fetch the active license for an organization.
 * Returns null if none found.
 */
const getActiveLicense = async (organizationId) => {
  return prisma.license.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: 'desc' },
  });
};

/**
 * Enforce max users limit before creating a new user inside an org.
 * Attach after authenticate + scopeOrganization on user/tenant create routes.
 */
const enforceUserLimit = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return next(); // superadmin — no org scope

    const license = await getActiveLicense(orgId);
    if (!license) {
      return next(new AppError('No active license found for this organization.', 403, 'LICENSE_REQUIRED'));
    }

    const currentCount = await prisma.user.count({
      where: { organizationId: orgId, deletedAt: null },
    });

    if (currentCount >= license.maxUsers) {
      return next(
        new AppError(
          `User limit reached (${license.maxUsers}). Upgrade your plan to add more users.`,
          403,
          'LICENSE_LIMIT_EXCEEDED'
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Enforce max buildings limit before creating a new building inside an org.
 */
const enforceBuildingLimit = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return next();

    const license = await getActiveLicense(orgId);
    if (!license) {
      return next(new AppError('No active license found for this organization.', 403, 'LICENSE_REQUIRED'));
    }

    const currentCount = await prisma.building.count({
      where: { organizationId: orgId, deletedAt: null },
    });

    if (currentCount >= license.maxBuildings) {
      return next(
        new AppError(
          `Building limit reached (${license.maxBuildings}). Upgrade your plan to add more buildings.`,
          403,
          'LICENSE_LIMIT_EXCEEDED'
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Enforce max apartments limit before creating a new apartment inside an org.
 */
const enforceApartmentLimit = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return next();

    const license = await getActiveLicense(orgId);
    if (!license) {
      return next(new AppError('No active license found for this organization.', 403, 'LICENSE_REQUIRED'));
    }

    const currentCount = await prisma.apartment.count({
      where: { organizationId: orgId, deletedAt: null },
    });

    if (currentCount >= license.maxApartments) {
      return next(
        new AppError(
          `Apartment limit reached (${license.maxApartments}). Upgrade your plan to add more apartments.`,
          403,
          'LICENSE_LIMIT_EXCEEDED'
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { enforceUserLimit, enforceBuildingLimit, enforceApartmentLimit };