import mongoose, { Schema } from 'mongoose';
import { IAuditLog } from '../types';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: String,
    targetId: Schema.Types.ObjectId,
    details: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);