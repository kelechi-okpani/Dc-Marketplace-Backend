import mongoose, { Schema } from 'mongoose';
import { IReferralCampaign } from '../types';

const ReferralCampaignSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ['state','church','department','campaign','general'], required: true },
    stateCode: String, churchName: String, coordinatorName: String,
    coordinatorUser: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
    totalClicks: { type: Number, default: 0 },
    totalRegistrations: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },
    totalSellers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IReferralCampaign>('ReferralCampaign', ReferralCampaignSchema);