import mongoose, { Schema } from 'mongoose';
import { IListing } from '../types';

const ListingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, min: 0 },
    priceNegotiable: { type: Boolean, default: false },
    priceLabel: String,
    currency: { type: String, default: 'NGN' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ url: String, publicId: String, isPrimary: { type: Boolean, default: false } }],
    state: { type: String, required: true },
    city: String, lga: String, address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    condition: { type: String, enum: ['new','used','refurbished','not_applicable'] },
    customFields: { type: Map, of: Schema.Types.Mixed },
    status: { type: String, enum: ['draft','pending_review','active','paused','sold','expired','rejected','removed'], default: 'pending_review' },
    rejectionReason: String,
    moderationStatus: { type: String, enum: ['pending','approved','rejected','flagged'], default: 'pending' },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date, moderationNote: String,
    availableUntil: Date,
    isSold: { type: Boolean, default: false }, soldAt: Date,
    isFeatured: { type: Boolean, default: false },
    isBoosted: { type: Boolean, default: false },
    featuredUntil: Date, boostedUntil: Date,
    boostPriority: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    chatCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
    tags: [String], expiresAt: Date, renewedAt: Date,
  },
  { timestamps: true }
);

ListingSchema.index({ coordinates: '2dsphere' });
ListingSchema.index({ seller: 1, status: 1 });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ state: 1, status: 1 });
ListingSchema.index({ isFeatured: 1, boostedUntil: 1 });
ListingSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IListing>('Listing', ListingSchema);