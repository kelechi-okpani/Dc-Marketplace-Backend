import Report from '../../models/Report.model';
import Listing from '../../models/Listing.model';
import User from '../../models/User.model';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    reports: async (
      _: unknown,
      { status, priority, targetType, page = 1, limit = 20 }: Record<string, unknown>,
      context: GraphQLContext
    ) => {
      requireRole(context, 'moderator', 'admin', 'super_admin');
      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (targetType) query.targetType = targetType;

      const [data, total] = await Promise.all([
        Report.find(query)
          .populate('reporter', 'name email phone')
          .populate('targetListing', 'title status')
          .populate('targetUser', 'name email phone status')
          .sort({ priority: -1, createdAt: 1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit)),
        Report.countDocuments(query),
      ]);
      return { total, data };
    },
  },

  Mutation: {
    submitReport: async (_: unknown, { input }: { input: Record<string, unknown> }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const report = await Report.create({ ...input, reporter: authUser._id });
      if (input.targetType === 'listing' && input.targetListing)
        await Listing.findByIdAndUpdate(input.targetListing as string, { $inc: { reportCount: 1 } });
      if (input.targetType === 'user' && input.targetUser)
        await User.findByIdAndUpdate(input.targetUser as string, { $inc: { reportCount: 1 } });
      return report;
    },

    resolveReport: async (
      _: unknown,
      { id, status, actionTaken, resolutionNote }: { id: string; status: string; actionTaken?: string; resolutionNote?: string },
      context: GraphQLContext
    ) => {
      const authUser = requireRole(context, 'moderator', 'admin', 'super_admin');
      return await Report.findByIdAndUpdate(
        id,
        { status, actionTaken, resolutionNote, resolvedBy: authUser._id, resolvedAt: new Date() },
        { new: true }
      );
    },
  },
};