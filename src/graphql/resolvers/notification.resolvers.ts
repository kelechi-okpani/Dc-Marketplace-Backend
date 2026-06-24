import Notification from '../../models/Notification.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    notifications: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const [data, unreadCount] = await Promise.all([
        Notification.find({ user: authUser._id }).sort({ createdAt: -1 }).limit(50),
        Notification.countDocuments({ user: authUser._id, isRead: false }),
      ]);
      return { data, unreadCount };
    },
  },
  Mutation: {
    markNotificationRead: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);
      await Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
      return true;
    },
    markAllNotificationsRead: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      await Notification.updateMany({ user: authUser._id, isRead: false }, { isRead: true, readAt: new Date() });
      return true;
    },
  },
};