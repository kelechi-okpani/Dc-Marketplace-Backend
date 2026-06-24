import { Conversation, Message } from '../../models/Chat.model';
import Listing from '../../models/Listing.model';
import { requireAuth } from '../../middleware/auth.middleware';
import { UserInputError, ForbiddenError } from 'apollo-server-express';
import { getIO } from '../../config/socket';
import { GraphQLContext } from '../../types';

export default {
  Query: {
    conversations: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      return await Conversation.find({ participants: authUser._id, isActive: true, archivedBy: { $ne: authUser._id } })
        .populate('listing', 'title images status isSold')
        .populate('buyer', 'name avatar')
        .populate('seller', 'name avatar')
        .populate('lastMessage', 'content createdAt')
        .sort({ lastMessageAt: -1 });
    },

    messages: async (
      _: unknown,
      { conversationId, page = 1, limit = 50 }: { conversationId: string; page: number; limit: number },
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new UserInputError('Conversation not found');
      if (!conversation.participants.map(String).includes(authUser._id.toString())) {
        throw new ForbiddenError('Not authorized');
      }

      const data = await Message.find({ conversation: conversationId, isDeleted: false })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      await Message.updateMany(
        { conversation: conversationId, sender: { $ne: authUser._id }, 'readBy.user': { $ne: authUser._id } },
        { $push: { readBy: { user: authUser._id, readAt: new Date() } } }
      );

      conversation.unreadCount.set(authUser._id.toString(), 0);
      await conversation.save();

      return { data: data.reverse(), total: data.length };
    },
  },

  Mutation: {
    startConversation: async (_: unknown, { listingId }: { listingId: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const listing = await Listing.findById(listingId).populate<{ seller: { _id: { toString(): string } } }>('seller', '_id');
      if (!listing) throw new UserInputError('Listing not found');
      if (listing.seller._id.toString() === authUser._id.toString()) {
        throw new UserInputError('Cannot chat with yourself');
      }

      let conversation = await Conversation.findOne({ listing: listingId, buyer: authUser._id, seller: listing.seller._id });
      if (!conversation) {
        conversation = await Conversation.create({
          listing: listingId, buyer: authUser._id, seller: listing.seller._id,
          participants: [authUser._id, listing.seller._id],
        });
        listing.chatCount += 1;
        await listing.save({ validateBeforeSave: false });
      }
      return conversation;
    },

    sendMessage: async (
      _: unknown,
      { conversationId, content, messageType = 'text' }: { conversationId: string; content: string; messageType?: string },
      context: GraphQLContext
    ) => {
      const authUser = requireAuth(context);
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new UserInputError('Conversation not found');
      if (!conversation.participants.map(String).includes(authUser._id.toString())) throw new ForbiddenError('Not authorized');
      if (conversation.isBlocked) throw new ForbiddenError('Conversation is blocked');

      const message = await Message.create({ conversation: conversationId, sender: authUser._id, content, messageType });

      const otherUserId = conversation.participants.find((p) => p.toString() !== authUser._id.toString());
      if (otherUserId) {
        const current = conversation.unreadCount.get(otherUserId.toString()) ?? 0;
        conversation.unreadCount.set(otherUserId.toString(), current + 1);
      }
      conversation.lastMessage = message._id as any;
      conversation.lastMessageAt = message.createdAt as Date;
      conversation.lastMessagePreview = content.substring(0, 100);
      await conversation.save();

      const io = getIO();
      const populated = await message.populate('sender', 'name avatar');
      io.to(conversationId).emit('new_message', { message: populated, conversationId });
      if (otherUserId) io.to(otherUserId.toString()).emit('conversation_updated', { conversationId });

      return message;
    },

    blockConversation: async (_: unknown, { conversationId }: { conversationId: string }, context: GraphQLContext) => {
      const authUser = requireAuth(context);
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new UserInputError('Conversation not found');
      if (!conversation.participants.map(String).includes(authUser._id.toString())) throw new ForbiddenError('Not authorized');
      conversation.isBlocked = true;
      conversation.blockedBy = authUser._id as any;
      await conversation.save();
      return true;
    },
  },
};