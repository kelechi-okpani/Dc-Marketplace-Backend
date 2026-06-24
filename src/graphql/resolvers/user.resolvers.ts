import User from '../../models/User.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { UserInputError } from 'apollo-server-express';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    userProfile: async (_: unknown, { userId }: { userId: string }) => {
      const user = await User.findById(userId).select(
        'name avatar state city isSellerVerified dcMemberVerified verificationBadge totalListings activeListings createdAt'
      );
      if (!user) throw new UserInputError('User not found');
      return user;
    },
  },

  Mutation: {
    updateProfile: async (
      _: unknown,
      { input }: { input: Record<string, string> },
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);
      const allowedFields = ['name', 'state', 'city', 'lga'];
      const updates: Record<string, string> = {};
      allowedFields.forEach((f) => { if (input[f] !== undefined) updates[f] = input[f]; });
      const user = await User.findByIdAndUpdate(authUser._id, updates, { new: true, runValidators: true });
      return user;
    },

    updatePassword: async (
      _: unknown,
      { input }: { input: { currentPassword: string; newPassword: string } },
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);
      const user = await User.findById(authUser._id).select('+password');
      if (!user || !(await user.matchPassword(input.currentPassword))) {
        throw new UserInputError('Current password incorrect');
      }
      user.password = input.newPassword;
      await user.save();
      return true;
    },

    deleteAccount: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      await User.findByIdAndUpdate(authUser._id, { status: 'banned', email: null, phone: null });
      return true;
    },
  },
};