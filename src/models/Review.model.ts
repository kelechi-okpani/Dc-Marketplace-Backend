import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types';

const ReviewSchema = new Schema<IReview>(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    type: { type: String, enum: ['buyer_to_seller','seller_to_buyer'], required: true },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ reviewee: 1, isVisible: 1 });

export default mongoose.model<IReview>('Review', ReviewSchema);