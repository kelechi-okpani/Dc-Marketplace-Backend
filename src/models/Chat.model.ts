import mongoose, { Schema } from 'mongoose';
import { IConversation, IMessage } from '../types';

const ConversationSchema = new Schema<IConversation>(
  {
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: Date,
    lastMessagePreview: String,
    unreadCount: { type: Map, of: Number, default: {} },
    blockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isBlocked: { type: Boolean, default: false },
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ buyer: 1, seller: 1, listing: 1 }, { unique: true });
ConversationSchema.index({ participants: 1 });

const MessageSchema = new Schema<IMessage & { deletedAt?: Date; reportedAt?: Date }>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    messageType: { type: String, enum: ['text','image','offer','system'], default: 'text' },
    imageUrl: String,
    readBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, readAt: Date }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    isReported: { type: Boolean, default: false },
    reportedAt: Date,
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);