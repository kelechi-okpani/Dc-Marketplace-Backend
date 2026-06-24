import { Response, NextFunction } from 'express';
import { Conversation, Message } from '../models/Chat.model';
import Listing from '../models/Listing.model';
import asyncHandler from '../middleware/asyncHandler';
import ErrorResponse from '../utils/errorResponse';
import { getIO } from '../config/socket';
import { AuthRequest } from '../types';

export const startConversation = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { listingId } = req.body as { listingId: string; initialMessage?: string };
  const listing = await Listing.findById(listingId).populate<{ seller: { _id: { toString(): string } } }>('seller', '_id');
  if (!listing) return next(new ErrorResponse('Listing not found', 404));
  if (listing.seller._id.toString() === req.user!._id.toString()) return next(new ErrorResponse('Cannot chat with yourself', 400));

  let conversation = await Conversation.findOne({ listing: listingId, buyer: req.user!._id, seller: listing.seller._id });
  if (!conversation) {
    conversation = await Conversation.create({
      listing: listingId, buyer: req.user!._id, seller: listing.seller._id,
      participants: [req.user!._id, listing.seller._id],
    });
    listing.chatCount += 1;
    await listing.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, data: conversation });
});

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversations = await Conversation.find({ participants: req.user!._id, isActive: true, archivedBy: { $ne: req.user!._id } })
    .populate('listing', 'title images status isSold')
    .populate('buyer', 'name avatar')
    .populate('seller', 'name avatar')
    .populate('lastMessage', 'content createdAt')
    .sort({ lastMessageAt: -1 });
  res.status(200).json({ success: true, data: conversations });
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new ErrorResponse('Conversation not found', 404));
  if (!conversation.participants.map(String).includes(req.user!._id.toString())) return next(new ErrorResponse('Not authorized', 403));

  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  const messages = await Message.find({ conversation: req.params.id, isDeleted: false })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  await Message.updateMany(
    { conversation: req.params.id, sender: { $ne: req.user!._id }, 'readBy.user': { $ne: req.user!._id } },
    { $push: { readBy: { user: req.user!._id, readAt: new Date() } } }
  );

  conversation.unreadCount.set(req.user!._id.toString(), 0);
  await conversation.save();

  res.status(200).json({ success: true, data: messages.reverse() });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new ErrorResponse('Conversation not found', 404));
  if (!conversation.participants.map(String).includes(req.user!._id.toString())) return next(new ErrorResponse('Not authorized', 403));
  if (conversation.isBlocked) return next(new ErrorResponse('Conversation is blocked', 403));

  const { content, messageType } = req.body as { content: string; messageType?: string };

  const message = await Message.create({
    conversation: req.params.id, sender: req.user!._id, content,
    messageType: messageType ?? 'text',
  });

  const otherUserId = conversation.participants.find((p) => p.toString() !== req.user!._id.toString());
  if (otherUserId) {
    const currentUnread = conversation.unreadCount.get(otherUserId.toString()) ?? 0;
    conversation.unreadCount.set(otherUserId.toString(), currentUnread + 1);
  }
  conversation.lastMessage = message._id as any;
  conversation.lastMessageAt = (message as any).createdAt as Date;
  conversation.lastMessagePreview = content.substring(0, 100);
  await conversation.save();

  const io = getIO();
  const populated = await message.populate('sender', 'name avatar');
  io.to(req.params.id).emit('new_message', { message: populated, conversationId: req.params.id });
  if (otherUserId) io.to(otherUserId.toString()).emit('conversation_updated', { conversationId: req.params.id });

  res.status(201).json({ success: true, data: message });
});

export const blockConversation = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new ErrorResponse('Conversation not found', 404));
  if (!conversation.participants.map(String).includes(req.user!._id.toString())) return next(new ErrorResponse('Not authorized', 403));
  conversation.isBlocked = true;
  conversation.blockedBy = req.user!._id as any;
  await conversation.save();
  res.status(200).json({ success: true, message: 'Conversation blocked' });
});