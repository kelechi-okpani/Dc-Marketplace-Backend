import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types';

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['new_message','listing_approved','listing_rejected','listing_expiring','boost_expired','new_review','account_warning','account_suspended','report_resolved','verification_approved','verification_rejected','system'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    channel: { type: String, enum: ['in_app','push','email','sms'], default: 'in_app' },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model<INotification>('Notification', NotificationSchema);