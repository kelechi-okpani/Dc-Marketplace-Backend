import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../types';

const PaymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing' },
    type: { type: String, enum: ['boost','featured','seller_plan','verification','category_sponsor'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    status: { type: String, enum: ['pending','success','failed','refunded'], default: 'pending' },
    gateway: { type: String, enum: ['paystack','flutterwave'] },
    gatewayReference: String,
    gatewayResponse: { type: Schema.Types.Mixed },
    paidAt: Date, refundedAt: Date, refundReason: String,
    metadata: { type: Schema.Types.Mixed },
  } as any,
  { timestamps: true }
);

PaymentSchema.index({ user: 1, status: 1 });
PaymentSchema.index({ gatewayReference: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);