import Category from '../../models/Category.model';
import { requireRole } from '../../middleware/auth.middleware';
import { UserInputError } from 'apollo-server-express';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    categories: async () => {
      return await Category.find({ parent: null, isActive: true }).populate('subcategories').sort('order');
    },
    category: async (_: unknown, { slug }: { slug: string }) => {
      const category = await Category.findOne({ slug }).populate('subcategories');
      if (!category) throw new UserInputError('Category not found');
      return category;
    },
  },

  Mutation: {
    createCategory: async (_: unknown, { input }: { input: Record<string, unknown> }, context: GraphQLContext) => {
      requireRole(context, 'admin', 'super_admin');
      return await Category.create(input);
    },
    updateCategory: async (_: unknown, { id, input }: { id: string; input: Record<string, unknown> }, context: GraphQLContext) => {
      requireRole(context, 'admin', 'super_admin');
      return await Category.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    },
  },
};