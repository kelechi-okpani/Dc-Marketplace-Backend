import axios from 'axios';
import Payment from '../../models/Payment.model';
import { PromotionPackage } from '../../models/Promotion.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { UserInputError } from 'apollo-server-express';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    myPayments: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      return await Payment.find({ user: authUser._id }).sort({ createdAt: -1 });
    },
  },

  Mutation: {
    initializePayment: async (
      _: unknown,
      { packageId, listingId }: { packageId: string; listingId: string },
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);
      const pkg = await PromotionPackage.findById(packageId);
      if (!pkg) throw new UserInputError('Package not found');

      const payment = await Payment.create({
        user: authUser._id, listing: listingId, type: pkg.type,
        amount: pkg.price, gateway: 'paystack', status: 'pending',
        metadata: { packageId },
      });

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: authUser.email ?? `${authUser.phone}@shuk.ng`,
          amount: pkg.price * 100,
          reference: payment._id.toString(),
        },
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
      );

      return { payment, authorizationUrl: (response.data as any).data.authorization_url };
    },
  },
};