import mongoose, { Schema } from 'mongoose';
import { IPromotionPackage, IActivePromotion } from '../types';

const PromotionPackageSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['boost','featured','category_top','homepage_banner'], required: true },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
    description: String,
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 1 },
    maxPerCategory: Number,
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  },
  { timestamps: true }
);

const ActivePromotionSchema = new Schema<IActivePromotion>(
  {
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: Schema.Types.ObjectId, ref: 'PromotionPackage', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    type: { type: String, enum: ['boost','featured','category_top','homepage_banner'] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ActivePromotionSchema.index({ listing: 1, isActive: 1 });
ActivePromotionSchema.index({ endsAt: 1 });

export const PromotionPackage = mongoose.model<IPromotionPackage>('PromotionPackage', PromotionPackageSchema);
export const ActivePromotion = mongoose.model<IActivePromotion>('ActivePromotion', ActivePromotionSchema);