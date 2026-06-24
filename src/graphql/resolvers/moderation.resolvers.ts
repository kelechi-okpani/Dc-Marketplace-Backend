import Listing from '../../models/Listing.model';
import AuditLog from '../../models/AuditLog.model';
import Notification from '../../models/Notification.model';
import { requireRole } from '../../middleware/auth.middleware';
import { UserInputError } from 'apollo-server-express';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    moderationQueue: async (
      _: unknown,
      { page = 1, limit = 20 }: { page?: number; limit?: number },
      context: GraphQLContext
    ) => {
      requireRole(context, 'moderator', 'admin', 'super_admin');
      const [data, total] = await Promise.all([
        Listing.find({ moderationStatus: 'pending' })
          .populate('seller', 'name email phone isSellerVerified reportCount')
          .populate('category', 'name isHighRisk')
          .sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
        Listing.countDocuments({ moderationStatus: 'pending' }),
      ]);
      return { total, data };
    },
  },

  Mutation: {
    approveListing: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const authUser = requireRole(context, 'moderator', 'admin', 'super_admin');
      const listing = await Listing.findByIdAndUpdate(
        id,
        { moderationStatus: 'approved', status: 'active', moderatedBy: authUser._id, moderatedAt: new Date() },
        { new: true }
      );
      if (!listing) throw new UserInputError('Listing not found');
      await AuditLog.create({ actor: authUser._id, action: 'listing.approve', targetType: 'listing', targetId: id });
      await Notification.create({
        user: listing.seller, type: 'listing_approved', title: 'Listing Approved',
        body: `Your listing "${listing.title}" is now live.`, data: { listingId: listing._id },
      });
      return listing;
    },

    rejectListing: async (
      _: unknown,
      { id, reason, note }: { id: string; reason: string; note?: string },
      context: GraphQLContext
    ) => {
      const authUser = requireRole(context, 'moderator', 'admin', 'super_admin');
      const listing = await Listing.findByIdAndUpdate(
        id,
        { moderationStatus: 'rejected', status: 'rejected', rejectionReason: reason, moderationNote: note, moderatedBy: authUser._id, moderatedAt: new Date() },
        { new: true }
      );
      if (!listing) throw new UserInputError('Listing not found');
      await AuditLog.create({ actor: authUser._id, action: 'listing.reject', targetType: 'listing', targetId: id, details: { reason } });
      await Notification.create({
        user: listing.seller, type: 'listing_rejected', title: 'Listing Not Approved',
        body: `Your listing "${listing.title}" was not approved. Reason: ${reason}`,
        data: { listingId: listing._id },
      });
      return listing;
    },

    flagListing: async (
      _: unknown,
      { id, note }: { id: string; note?: string },
      context: GraphQLContext
    ) => {
      const authUser = requireRole(context, 'moderator', 'admin', 'super_admin');
      const listing = await Listing.findByIdAndUpdate(
        id,
        { isFlagged: true, moderationStatus: 'flagged', moderatedBy: authUser._id, moderationNote: note },
        { new: true }
      );
      if (!listing) throw new UserInputError('Listing not found');
      await AuditLog.create({ actor: authUser._id, action: 'listing.flag', targetType: 'listing', targetId: id });
      return listing;
    },
  },
};