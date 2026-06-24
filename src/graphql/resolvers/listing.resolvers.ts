import Listing from '../../models/Listing.model';
import Category from '../../models/Category.model';
import SavedListing from '../../models/SavedListing.model';
import User from '../../models/User.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { UserInputError, ForbiddenError } from 'apollo-server-express';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    listings: async (_: unknown, { filters = {} }: { filters: Record<string, unknown> }) => {
      const { category, subcategory, state, city, lga, minPrice, maxPrice,
        condition, isFeatured, isBoosted, sort, page = 1, limit = 20 } = filters;

      const query: Record<string, unknown> = { status: 'active', moderationStatus: 'approved' };
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (state) query.state = state;
      if (city) query.city = city;
      if (lga) query.lga = lga;
      if (condition) query.condition = condition;
      if (isFeatured) query.isFeatured = true;
      if (isBoosted) query.isBoosted = true;
      if (minPrice || maxPrice) {
        query.price = {} as Record<string, number>;
        if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
        if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
      }

      const sortObj: Record<string, 1 | -1 | { $meta: 'textScore' }> =
        sort === 'price_asc' ? { price: 1 }
        : sort === 'price_desc' ? { price: -1 }
        : sort === 'popular' ? { views: -1 }
        : sort === 'boost' ? { boostPriority: -1, createdAt: -1 }
        : { createdAt: -1 };

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [data, total] = await Promise.all([
        Listing.find(query)
          .populate('seller', 'name avatar isSellerVerified dcMemberVerified state city createdAt')
          .populate('category', 'name slug')
          .sort(sortObj as any)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Listing.countDocuments(query),
      ]);

      return { total, page: pageNum, pages: Math.ceil(total / limitNum), data };
    },

    listing: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const listing = await Listing.findById(id)
        .populate('seller', 'name avatar isSellerVerified dcMemberVerified state city totalListings createdAt')
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug');

      if (!listing) throw new UserInputError('Listing not found');

      const isOwner = context.user && context.user._id.toString() === (listing.seller as any)._id.toString();
      if (listing.status !== 'active' && !isOwner) throw new UserInputError('Listing not found');

      listing.views += 1;
      await listing.save({ validateBeforeSave: false });

      return listing;
    },

    myListings: async (
      _: unknown,
      { status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number },
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);
      const query: Record<string, unknown> = { seller: authUser._id };
      if (status) query.status = status;

      const [data, total] = await Promise.all([
        Listing.find(query).populate('category', 'name slug').sort({ createdAt: -1 })
          .skip((page - 1) * limit).limit(limit),
        Listing.countDocuments(query),
      ]);

      return { total, page, pages: Math.ceil(total / limit), data };
    },

    savedListings: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const saved = await SavedListing.find({ user: authUser._id })
        .populate({ path: 'listing', populate: [{ path: 'seller', select: 'name avatar isSellerVerified' }, { path: 'category', select: 'name slug' }] })
        .sort({ createdAt: -1 });
      return saved.map((s) => s.listing).filter(Boolean);
    },

    searchListings: async (_: unknown, { q, filters = {} }: { q: string; filters: Record<string, unknown> }) => {
      if (!q) throw new UserInputError('Search query required');

      const { state, category, minPrice, maxPrice, condition, sort, page = 1, limit = 20 } = filters;

      const query: Record<string, unknown> = {
        $text: { $search: q }, status: 'active', moderationStatus: 'approved',
      };
      if (state) query.state = state;
      if (category) query.category = category;
      if (condition) query.condition = condition;
      if (minPrice || maxPrice) {
        query.price = {} as Record<string, number>;
        if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
        if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
      }

      const sortObj: Record<string, 1 | -1 | { $meta: 'textScore' }> =
        sort === 'relevance' ? { score: { $meta: 'textScore' } }
        : sort === 'price_asc' ? { price: 1 }
        : sort === 'price_desc' ? { price: -1 }
        : { createdAt: -1 };

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [data, total] = await Promise.all([
        Listing.find(query)
          .populate('seller', 'name avatar isSellerVerified')
          .populate('category', 'name slug')
          .sort(sortObj as any).skip((pageNum - 1) * limitNum).limit(limitNum),
        Listing.countDocuments(query),
      ]);

      return { total, page: pageNum, pages: Math.ceil(total / limitNum), data };
    },
  },

  Mutation: {
    createListing: async (_: unknown, { input }: { input: Record<string, unknown> }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const category = await Category.findById(input.category);
      if (!category) throw new UserInputError('Category not found');
      const listing = await Listing.create({ ...input, seller: authUser._id });
      await User.findByIdAndUpdate(authUser._id, { $inc: { totalListings: 1 } });
      return listing;
    },

    updateListing: async (_: unknown, { id, input }: { id: string; input: Record<string, unknown> }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const listing = await Listing.findById(id);
      if (!listing) throw new UserInputError('Listing not found');

      const isOwner = listing.seller.toString() === authUser._id.toString();
      const isAdmin = ['admin', 'super_admin'].includes(authUser.role);
      if (!isOwner && !isAdmin) throw new ForbiddenError('Not authorized');

      const updates = isOwner ? { ...input, moderationStatus: 'pending', status: 'pending_review' } : input;
      return await Listing.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    },

    deleteListing: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const listing = await Listing.findById(id);
      if (!listing) throw new UserInputError('Listing not found');

      const isOwner = listing.seller.toString() === authUser._id.toString();
      const isAdmin = ['admin', 'super_admin'].includes(authUser.role);
      if (!isOwner && !isAdmin) throw new ForbiddenError('Not authorized');

      await listing.deleteOne();
      await User.findByIdAndUpdate(authUser._id, { $inc: { totalListings: -1 } });
      return true;
    },

    markListingSold: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const listing = await Listing.findById(id);
      if (!listing) throw new UserInputError('Listing not found');
      if (listing.seller.toString() !== authUser._id.toString()) throw new ForbiddenError('Not authorized');
      listing.isSold = true;
      listing.status = 'sold';
      listing.soldAt = new Date();
      await listing.save();
      return listing;
    },

    toggleSaveListing: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const existing = await SavedListing.findOne({ user: authUser._id, listing: id });
      if (existing) {
        await existing.deleteOne();
        await Listing.findByIdAndUpdate(id, { $inc: { saves: -1 } });
        return false;
      }
      await SavedListing.create({ user: authUser._id, listing: id });
      await Listing.findByIdAndUpdate(id, { $inc: { saves: 1 } });
      return true;
    },
  },
};