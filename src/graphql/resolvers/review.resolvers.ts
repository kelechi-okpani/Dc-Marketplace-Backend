import Review from '../../models/Review.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    userReviews: async (_: unknown, { userId }: { userId: string }) => {
      return await Review.find({ reviewee: userId, isVisible: true })
        .populate('reviewer', 'name avatar')
        .populate('listing', 'title')
        .sort({ createdAt: -1 });
    },
  },
  Mutation: {
    createReview: async (_: unknown, { input }: { input: Record<string, unknown> }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      return await Review.create({ ...input, reviewer: authUser._id });
    },
  },
};