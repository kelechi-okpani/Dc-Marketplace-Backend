import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

// typeDefs
import authTypeDefs from './typeDefs/auth.typeDefs';
import userTypeDefs from './typeDefs/user.typeDefs';
import listingTypeDefs from './typeDefs/listing.typeDefs';
import categoryTypeDefs from './typeDefs/category.typeDefs';
import chatTypeDefs from './typeDefs/chat.typeDefs';
import paymentTypeDefs from './typeDefs/payment.typeDefs';
import promotionTypeDefs from './typeDefs/promotion.typeDefs';
import reportTypeDefs from './typeDefs/report.typeDefs';
import reviewTypeDefs from './typeDefs/review.typeDefs';
import referralTypeDefs from './typeDefs/referral.typeDefs';
import notificationTypeDefs from './typeDefs/notification.typeDefs';
import adminTypeDefs from './typeDefs/admin.typeDefs';
import moderationTypeDefs from './typeDefs/moderation.typeDefs';
import uploadTypeDefs from './typeDefs/upload.typeDefs';

// resolvers
import authResolvers from './resolvers/auth.resolvers';
import userResolvers from './resolvers/user.resolvers';
import listingResolvers from './resolvers/listing.resolvers';
import categoryResolvers from './resolvers/category.resolvers';
import chatResolvers from './resolvers/chat.resolvers';
import paymentResolvers from './resolvers/payment.resolvers';
import promotionResolvers from './resolvers/promotion.resolvers';
import reportResolvers from './resolvers/report.resolvers';
import reviewResolvers from './resolvers/review.resolvers';
import referralResolvers from './resolvers/referral.resolvers';
import notificationResolvers from './resolvers/notification.resolvers';
import adminResolvers from './resolvers/admin.resolvers';
import moderationResolvers from './resolvers/moderation.resolvers';

const typeDefs = mergeTypeDefs([
  authTypeDefs, userTypeDefs, listingTypeDefs, categoryTypeDefs,
  chatTypeDefs, paymentTypeDefs, promotionTypeDefs, reportTypeDefs,
  reviewTypeDefs, referralTypeDefs, notificationTypeDefs,
  adminTypeDefs, moderationTypeDefs, uploadTypeDefs,
]);

const resolvers = mergeResolvers([
  authResolvers, userResolvers, listingResolvers, categoryResolvers,
  chatResolvers, paymentResolvers, promotionResolvers, reportResolvers,
  reviewResolvers, referralResolvers, notificationResolvers,
  adminResolvers, moderationResolvers,
]);

export const schema = makeExecutableSchema({ typeDefs, resolvers });