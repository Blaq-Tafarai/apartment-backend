const prisma = require('../database/prisma/client');
const { AppError } = require('./error.middleware');

/**
 * Verifies that the authenticated user's organization has an active subscription.
 * Blocks any request from an org with a cancelled, expired, or missing subscription.
 *
 * Superadmins bypass this check — they manage the platform itself.
 * Mount AFTER authenticate + scopeOrganization.
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    // Superadmins are exempt
    if (!req.user || req.user.role === 'superadmin') return next();

    const orgId = req.organizationId;
    if (!orgId) return next();

    const org = await prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
      include: {
        subscription: {
          select: { status: true, endDate: true, planName: true },
        },
      },
    });

    if (!org) {
      return next(new AppError('Organization not found.', 404, 'NOT_FOUND'));
    }

    if (org.status !== 'active') {
      return next(
        new AppError(
          'Your organization account is not active. Please contact support.',
          403,
          'ORG_INACTIVE'
        )
      );
    }

    const sub = org.subscription;

    if (!sub) {
      return next(
        new AppError(
          'No subscription found for your organization. Please contact your administrator.',
          403,
          'SUBSCRIPTION_REQUIRED'
        )
      );
    }

    if (sub.status === 'cancelled') {
      return next(
        new AppError(
          'Your subscription has been cancelled. Please contact your administrator to reactivate.',
          403,
          'SUBSCRIPTION_CANCELLED'
        )
      );
    }

    if (sub.status === 'expired' || new Date(sub.endDate) < new Date()) {
      return next(
        new AppError(
          'Your subscription has expired. Please renew to continue using the platform.',
          403,
          'SUBSCRIPTION_EXPIRED'
        )
      );
    }

    if (sub.status === 'inactive') {
      return next(
        new AppError(
          'Your subscription is inactive. Please contact your administrator.',
          403,
          'SUBSCRIPTION_INACTIVE'
        )
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireActiveSubscription };