import mongoose, { Schema } from 'mongoose';
import { IReport } from '../types';

type ReportSchemaType = IReport & { targetMessage?: mongoose.Types.ObjectId };

const ReportSchema = new Schema<ReportSchemaType>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['listing','user','message'], required: true },
    targetListing: { type: Schema.Types.ObjectId, ref: 'Listing' },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    targetMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    reason: { type: String, enum: ['scam_or_fraud','fake_listing','prohibited_item','wrong_category','spam','offensive_content','counterfeit','harassment','other'], required: true },
    description: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['open','under_review','resolved_action_taken','resolved_no_action','dismissed'], default: 'open' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date, resolutionNote: String,
    actionTaken: { type: String, enum: ['none','listing_removed','listing_hidden','user_warned','user_suspended','user_banned'] },
    priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, priority: 1 });
ReportSchema.index({ targetUser: 1 });
ReportSchema.index({ targetListing: 1 });

export default mongoose.model<IReport>('Report', ReportSchema);