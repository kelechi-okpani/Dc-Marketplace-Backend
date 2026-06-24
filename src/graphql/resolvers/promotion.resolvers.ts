import { PromotionPackage, ActivePromotion } from '../../models/Promotion.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    promotionPackages: async () => {
      return await PromotionPackage.find({ isActive: true }).sort('price');
    },
    activePromotions: async () => {
      return await ActivePromotion.find({ isActive: true, endsAt: { $gte: new Date() } })
        .populate('listing', 'title images price state category')
        .populate('package', 'type name');
    },
    myPromotions: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      return await ActivePromotion.find({ seller: authUser._id }).sort({ createdAt: -1 });
    },
  },
};