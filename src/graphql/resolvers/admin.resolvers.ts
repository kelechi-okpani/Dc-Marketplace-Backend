import User from '../../models/User.model';
import Listing from '../../models/Listing.model';
import Report from '../../models/Report.model';
import AuditLog from '../../models/AuditLog.model';
import ReferralCampaign from '../../models/Referral.model';
import { requireRole } from '../../middleware/auth.middleware';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    adminDashboard: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireRole(context, 'admin', 'super_admin');
      const [totalUsers, totalListings, activeListings, pendingModeration, openReports] = await Promise.all([
        User.countDocuments(), Listing.countDocuments(),
        Listing.countDocuments({ status: 'active' }),
        Listing.countDocuments({ moderationStatus: 'pending' }),
        Report.countDocuments({ status: 'open' }),
      ]);
      return { totalUsers, totalListings, activeListings, pendingModeration, openReports };
    },

    adminUsers: async (
      _: unknown,
      { status, role, search, page = 1, limit = 20 }: Record<string, unknown>,
      context: GraphQLContext
    ) => {
      requireRole(context, 'admin', 'super_admin');
      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      if (role) query.role = role;
      if (search) query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
      const [data, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
        User.countDocuments(query),
      ]);
      return { total, data };
    },

    adminReferralCampaigns: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireRole(context, 'admin', 'super_admin');
      return await ReferralCampaign.find().sort({ totalRegistrations: -1 });
    },

    auditLogs: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireRole(context, 'admin', 'super_admin');
      return await AuditLog.find().populate('actor', 'name email role').sort({ createdAt: -1 }).limit(100);
    },
  },

  Mutation: {
    suspendUser: async (
      _: unknown,
      { id, reason, until }: { id: string; reason: string; until?: string },
      context: GraphQLContext
    ) => {
      const authUser = requireRole(context, 'admin', 'super_admin');
      const user = await User.findByIdAndUpdate(
        id,
        { status: 'suspended', suspensionReason: reason, suspendedAt: new Date(), suspendedUntil: until },
        { new: true }
      );
      await AuditLog.create({ actor: authUser._id, action: 'user.suspend', targetType: 'user', targetId: id, details: { reason } });
      return user;
    },

    restoreUser: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const authUser = requireRole(context, 'admin', 'super_admin');
      const user = await User.findByIdAndUpdate(id, { status: 'active', suspensionReason: null }, { new: true });
      await AuditLog.create({ actor: authUser._id, action: 'user.restore', targetType: 'user', targetId: id });
      return user;
    },

    createReferralCampaign: async (_: unknown, { input }: { input: Record<string, unknown> }, context: GraphQLContext) => {
      requireRole(context, 'admin', 'super_admin');
      return await ReferralCampaign.create(input);
    },
  },
};