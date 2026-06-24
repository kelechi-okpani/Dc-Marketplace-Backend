import mongoose, { Schema } from 'mongoose';
import { ICategory, IField } from '../types';

const FieldSchema = new Schema<IField>({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text','number','select','multiselect','boolean','date'], required: true },
  options: [String],
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String, icon: String, image: String,
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isHighRisk: { type: Boolean, default: false },
    requiresAdminReview: { type: Boolean, default: false },
    customFields: [FieldSchema],
    prohibitedKeywords: [String],
    metaTitle: String, metaDescription: String,
    totalListings: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

export default mongoose.model<ICategory>('Category', CategorySchema);