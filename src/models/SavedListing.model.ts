import mongoose, { Schema } from 'mongoose';
import { ISavedListing } from '../types';

const SavedListingSchema = new Schema<ISavedListing>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  },
  { timestamps: true }
);

SavedListingSchema.index({ user: 1, listing: 1 }, { unique: true });

export default mongoose.model<ISavedListing>('SavedListing', SavedListingSchema);